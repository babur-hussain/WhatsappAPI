import prisma from '../config/database';
import { BroadcastStatus, RecipientStatus } from '@prisma/client';
import { broadcastQueue } from '../config/queue';
import { whatsappService } from './whatsapp.service';
import { contactService } from './contact.service';
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

        const recentBroadcast = await prisma.broadcast.findFirst({
            where: {
                factoryId,
                createdAt: { gte: new Date(Date.now() - 30 * 1000) },
            },
        });

        if (recentBroadcast) {
            throw new Error('Please wait at least 30 seconds between broadcasts.');
        }

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

        const recipientData = leads.map((lead: any) => ({
            broadcastId: broadcast.id,
            leadId: lead.id,
            phoneNumber: lead.customerPhone,
            status: RecipientStatus.PENDING,
        }));

        await prisma.broadcastRecipient.createMany({ data: recipientData });

        const recipients = await prisma.broadcastRecipient.findMany({
            where: { broadcastId: broadcast.id, status: RecipientStatus.PENDING },
            select: { id: true, leadId: true, phoneNumber: true },
        });

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
     * Create a broadcast from a contact list
     */
    public async createBroadcastFromContactList(factoryId: string, data: {
        title: string;
        message: string;
        mediaUrl?: string;
        contactListId: string;
    }) {
        const contacts = await contactService.getContactsFromList(factoryId, data.contactListId);

        if (contacts.length === 0) {
            throw new Error('No contacts found in the selected list');
        }

        if (contacts.length > 5000) {
            throw new Error('Contact list exceeds the limit of 5000 recipients.');
        }

        const broadcast = await prisma.broadcast.create({
            data: {
                factoryId,
                title: data.title,
                message: data.message,
                mediaUrl: data.mediaUrl,
                targetType: 'CONTACT_LIST',
                status: BroadcastStatus.SENDING,
                totalRecipients: contacts.length,
            },
        });

        const recipientData = contacts.map((contact: any) => ({
            broadcastId: broadcast.id,
            contactId: contact.id,
            phoneNumber: contact.phone,
            status: RecipientStatus.PENDING,
        }));

        await prisma.broadcastRecipient.createMany({ data: recipientData });

        const recipients = await prisma.broadcastRecipient.findMany({
            where: { broadcastId: broadcast.id, status: RecipientStatus.PENDING },
            select: { id: true, contactId: true, phoneNumber: true },
        });

        for (const recipient of recipients) {
            const contact = contacts.find((c: any) => c.id === recipient.contactId);
            const personalizedMessage = this.substitutePlaceholders(data.message, contact);

            await broadcastQueue.add(
                'processBroadcastRecipient',
                {
                    broadcastId: broadcast.id,
                    recipientId: recipient.id,
                    factoryId,
                    message: personalizedMessage,
                    mediaUrl: data.mediaUrl,
                    phoneNumber: recipient.phoneNumber,
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
     * Create a broadcast from an uploaded CSV/Excel file
     */
    public async createBroadcastFromFile(factoryId: string, data: {
        title: string;
        message: string;
        mediaUrl?: string;
    }, fileBuffer: Buffer, fileName: string) {
        const ext = fileName.split('.').pop()?.toLowerCase();

        let rows;
        if (ext === 'csv') {
            rows = contactService.parseCSV(fileBuffer);
        } else if (ext === 'xlsx' || ext === 'xls') {
            rows = contactService.parseExcel(fileBuffer);
        } else {
            throw new Error('Unsupported file type. Use CSV or Excel.');
        }

        if (rows.length === 0) throw new Error('File contains no data rows');
        if (rows.length > 5000) throw new Error('File exceeds the limit of 5000 recipients.');

        const validRows = rows.filter(r => r.phone && r.phone.replace(/\D/g, '').length >= 7);
        if (validRows.length === 0) throw new Error('No valid phone numbers found in file');

        const broadcast = await prisma.broadcast.create({
            data: {
                factoryId,
                title: data.title,
                message: data.message,
                mediaUrl: data.mediaUrl,
                targetType: 'CSV_UPLOAD',
                status: BroadcastStatus.SENDING,
                totalRecipients: validRows.length,
            },
        });

        const recipientData = validRows.map((row) => ({
            broadcastId: broadcast.id,
            phoneNumber: row.phone,
            status: RecipientStatus.PENDING,
        }));

        await prisma.broadcastRecipient.createMany({ data: recipientData });

        const recipients = await prisma.broadcastRecipient.findMany({
            where: { broadcastId: broadcast.id, status: RecipientStatus.PENDING },
            select: { id: true, phoneNumber: true },
        });

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const rowData = validRows[i];
            const personalizedMessage = this.substitutePlaceholders(data.message, rowData);

            await broadcastQueue.add(
                'processBroadcastRecipient',
                {
                    broadcastId: broadcast.id,
                    recipientId: recipient.id,
                    factoryId,
                    message: personalizedMessage,
                    mediaUrl: data.mediaUrl,
                    phoneNumber: recipient.phoneNumber,
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
     * Substitute placeholders in a message with contact/row data.
     * Supports {{name}}, {{phone}}, {{email}}, {{company}}, and any custom field key.
     */
    private substitutePlaceholders(message: string, data: any): string {
        if (!data) return message;
        let result = message;
        const fields: Record<string, string> = {
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            company: data.company || '',
        };

        if (data.customFields) {
            const custom = typeof data.customFields === 'string' ? JSON.parse(data.customFields) : data.customFields;
            Object.assign(fields, custom);
        }

        for (const [key, value] of Object.entries(data)) {
            if (!['id', 'factoryId', 'phoneHash', 'source', 'createdAt', 'updatedAt', 'tags', 'customFields', 'listMembers', 'broadcastRecipients'].includes(key)) {
                if (typeof value === 'string' && !fields[key]) {
                    fields[key] = value;
                }
            }
        }

        for (const [key, value] of Object.entries(fields)) {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), value);
        }

        // Also support numbered placeholders {{1}}, {{2}}, etc.
        const values = Object.values(fields).filter(v => v);
        values.forEach((value, index) => {
            result = result.replace(new RegExp(`\\{\\{${index + 1}\\}\\}`, 'g'), value);
        });

        return result;
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
        leadId?: string;
    }) {
        const { broadcastId, recipientId, factoryId, message, mediaUrl, phoneNumber, leadId } = data;

        try {
            if (mediaUrl) {
                await whatsappService.sendDocumentMessage(factoryId, phoneNumber, mediaUrl, message);
            } else {
                await whatsappService.sendTextMessage(factoryId, phoneNumber, message);
            }

            await prisma.broadcastRecipient.update({
                where: { id: recipientId },
                data: { status: RecipientStatus.SENT, sentAt: new Date() },
            });

            if (leadId) {
                await prisma.message.create({
                    data: {
                        leadId,
                        factoryId,
                        content: mediaUrl ? `[Broadcast Image/Document] ${message}` : message,
                        sender: 'BOT',
                        timestamp: new Date(),
                    },
                });
            }

            await prisma.broadcast.update({
                where: { id: broadcastId },
                data: { sentCount: { increment: 1 } },
            });

        } catch (error) {
            logger.error(`Broadcast message to ${phoneNumber} failed: ${(error as Error).message}`);

            await prisma.broadcastRecipient.update({
                where: { id: recipientId },
                data: { status: RecipientStatus.FAILED, error: (error as Error).message },
            });

            await prisma.broadcast.update({
                where: { id: broadcastId },
                data: { failedCount: { increment: 1 } },
            });

            throw error;
        }

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

    public async getBroadcasts(factoryId: string) {
        return prisma.broadcast.findMany({
            where: { factoryId },
            orderBy: { createdAt: 'desc' },
        });
    }

    public async getBroadcastDetails(factoryId: string, broadcastId: string, page = 1, limit = 50) {
        const broadcast = await prisma.broadcast.findFirst({
            where: { id: broadcastId, factoryId },
        });

        if (!broadcast) throw new Error('Broadcast not found');

        const skip = (page - 1) * limit;

        const [recipients, totalCount] = await Promise.all([
            prisma.broadcastRecipient.findMany({
                where: { broadcastId },
                include: {
                    lead: { select: { customerName: true } },
                    contact: { select: { name: true } },
                },
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
                customerName: r.lead?.customerName || r.contact?.name || null,
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
