import prisma from '../config/database';
import { BroadcastStatus, RecipientStatus } from '@prisma/client';
import { broadcastQueue } from '../config/queue';
import { whatsappService } from './whatsapp.service';
import { logger } from '../config/logger';

export class BroadcastService {
    /**
     * Create a new broadcast and select recipients based on targetType
     */
    public async createBroadcast(factoryId: string, data: {
        title: string;
        message: string;
        mediaUrl?: string;
        targetType: 'ALL_LEADS' | 'NEW_LEADS' | 'CONTACTED_LEADS' | 'CUSTOM_FILTER';
    }) {
        let whereClause: any = { factoryId };

        if (data.targetType === 'NEW_LEADS') {
            whereClause.status = 'NEW';
        } else if (data.targetType === 'CONTACTED_LEADS') {
            whereClause.status = 'CONTACTED';
        }

        // Fetch eligible leads
        const leads = await prisma.lead.findMany({
            where: whereClause,
            select: { id: true, customerPhone: true },
        });

        if (leads.length === 0) {
            throw new Error(`No recipients found for target type: ${data.targetType}`);
        }

        if (leads.length > 5000) {
            throw new Error('Broadcast size exceeds the limit of 5000 recipients.');
        }

        // Check if there was a broadcast recently (Minimum 30s delay)
        const recentBroadcast = await prisma.broadcast.findFirst({
            where: {
                factoryId,
                createdAt: {
                    gte: new Date(Date.now() - 30 * 1000), // last 30 seconds
                },
            },
        });

        if (recentBroadcast) {
            throw new Error('Please wait at least 30 seconds between broadcasts.');
        }

        // Create the broadcast
        const broadcast = await prisma.broadcast.create({
            data: {
                factoryId,
                title: data.title,
                message: data.message,
                mediaUrl: data.mediaUrl,
                targetType: data.targetType,
                status: BroadcastStatus.SENDING,
                totalRecipients: leads.length,
            },
        });

        // Create recipients in bulk
        const recipientData = leads.map(lead => ({
            broadcastId: broadcast.id,
            leadId: lead.id,
            phoneNumber: lead.customerPhone,
            status: RecipientStatus.PENDING,
        }));

        await prisma.broadcastRecipient.createMany({
            data: recipientData,
        });

        // Fetch created recipients to enqueue them
        const recipients = await prisma.broadcastRecipient.findMany({
            where: { broadcastId: broadcast.id, status: RecipientStatus.PENDING },
            select: { id: true, leadId: true, phoneNumber: true },
        });

        // Enqueue recipients to BullMQ
        for (const recipient of recipients) {
            await broadcastQueue.add(
                'processBroadcastRecipient',
                {
                    broadcastId: broadcast.id,
                    recipientId: recipient.id,
                    factoryId,
                    message: data.message,
                    mediaUrl: data.mediaUrl,
                    phoneNumber: recipient.phoneNumber,
                    leadId: recipient.leadId,
                },
                {
                    jobId: `broadcast-${recipient.id}`,
                    attempts: 2,
                    backoff: { type: 'exponential', delay: 2000 },
                    removeOnComplete: true,
                    removeOnFail: false,
                }
            );
        }

        return broadcast;
    }

    /**
     * Process a single broadcast recipient (Called by BullMQ worker)
     */
    public async processRecipient(data: {
        broadcastId: string;
        recipientId: string;
        factoryId: string;
        message: string;
        mediaUrl?: string;
        phoneNumber: string;
        leadId: string;
    }) {
        const { broadcastId, recipientId, factoryId, message, mediaUrl, phoneNumber, leadId } = data;

        try {
            if (mediaUrl) {
                await whatsappService.sendDocumentMessage(factoryId, phoneNumber, mediaUrl, message);
            } else {
                await whatsappService.sendTextMessage(factoryId, phoneNumber, message);
            }

            // Update recipient status
            await prisma.broadcastRecipient.update({
                where: { id: recipientId },
                data: { status: RecipientStatus.SENT, sentAt: new Date() },
            });

            // Store the broadcast message in the lead's conversation history
            await prisma.message.create({
                data: {
                    leadId,
                    factoryId,
                    content: mediaUrl ? `[Broadcast Image/Document] ${message}` : message,
                    sender: 'BOT',
                    timestamp: new Date(),
                },
            });

            // Increment successful count
            await prisma.broadcast.update({
                where: { id: broadcastId },
                data: {
                    sentCount: { increment: 1 },
                },
            });

        } catch (error) {
            logger.error(`Broadcast message to ${phoneNumber} failed: ${(error as Error).message}`);

            // Update recipient failure
            await prisma.broadcastRecipient.update({
                where: { id: recipientId },
                data: {
                    status: RecipientStatus.FAILED,
                    error: (error as Error).message,
                },
            });

            // Increment failed count
            await prisma.broadcast.update({
                where: { id: broadcastId },
                data: {
                    failedCount: { increment: 1 },
                },
            });

            throw error; // Retries according to queue config
        }

        // Check if broadcast is complete
        await this.checkBroadcastCompletion(broadcastId);
    }

    private async checkBroadcastCompletion(broadcastId: string) {
        const broadcast = await prisma.broadcast.findUnique({
            where: { id: broadcastId },
        });

        if (broadcast && broadcast.sentCount + broadcast.failedCount >= broadcast.totalRecipients) {
            await prisma.broadcast.update({
                where: { id: broadcastId },
                data: { status: BroadcastStatus.COMPLETED },
            });
            logger.info(`Broadcast ${broadcastId} completed.`);
        }
    }

    /**
     * Get list of broadcasts for a factory
     */
    public async getBroadcasts(factoryId: string) {
        return prisma.broadcast.findMany({
            where: { factoryId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get single broadcast details and paginated recipients
     */
    public async getBroadcastDetails(factoryId: string, broadcastId: string, page = 1, limit = 50) {
        const broadcast = await prisma.broadcast.findFirst({
            where: { id: broadcastId, factoryId },
        });

        if (!broadcast) {
            throw new Error('Broadcast not found');
        }

        const skip = (page - 1) * limit;

        const [recipients, totalCount] = await Promise.all([
            prisma.broadcastRecipient.findMany({
                where: { broadcastId },
                include: { lead: { select: { customerName: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.broadcastRecipient.count({ where: { broadcastId } }),
        ]);

        return {
            broadcast,
            recipients: recipients.map((r: any) => ({
                id: r.id,
                customerName: r.lead?.customerName || null,
                phoneNumber: r.phoneNumber,
                status: r.status,
                sentAt: r.sentAt,
                error: r.error,
            })),
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        };
    }
}

export const broadcastService = new BroadcastService();
