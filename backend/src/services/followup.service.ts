import prisma from '../config/database';
import { FollowUpStatus } from '@prisma/client';
import { followUpQueue } from '../config/queue';
import { whatsappService } from './whatsapp.service';
import { logger } from '../config/logger';

// Default templates
const DEFAULT_TEMPLATES: Record<number, string> = {
    1: 'Hi! Just checking if you had a chance to review our catalog. Let us know your requirements. — {factoryName}',
    2: 'Hello again! If you need pricing or bulk order details, our sales team is ready to assist. — {factoryName}',
    3: "We're available whenever you're ready. Feel free to share your requirement anytime. — {factoryName}",
};

export class FollowUpService {
    /**
     * Schedule follow-ups for a newly created lead
     */
    public async scheduleFollowUps(leadId: string, factoryId: string) {
        const factory = await prisma.factory.findUnique({ where: { id: factoryId } });
        if (!factory || !factory.followUpsEnabled) return;

        const followUpConfigs = [
            { num: 1, enabled: factory.followUp1Enabled, delay: factory.followUp1Delay, message: factory.followUp1Message },
            { num: 2, enabled: factory.followUp2Enabled, delay: factory.followUp2Delay, message: factory.followUp2Message },
            { num: 3, enabled: factory.followUp3Enabled, delay: factory.followUp3Delay, message: factory.followUp3Message },
        ];

        const now = new Date();

        for (const config of followUpConfigs) {
            if (!config.enabled) continue;

            const scheduledAt = new Date(now.getTime() + config.delay * 1000);
            const messageTemplate = config.message || DEFAULT_TEMPLATES[config.num];
            const message = messageTemplate.replace('{factoryName}', factory.factoryName);

            const followUp = await prisma.followUp.create({
                data: {
                    leadId,
                    factoryId,
                    followUpNumber: config.num,
                    scheduledAt,
                    message,
                    status: FollowUpStatus.PENDING,
                },
            });

            // Schedule BullMQ job with delay
            await followUpQueue.add(
                'processFollowUp',
                { followUpId: followUp.id, leadId, factoryId },
                {
                    delay: config.delay * 1000,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                    jobId: `followup-${followUp.id}`,
                    removeOnComplete: true,
                    removeOnFail: false,
                }
            );
        }

        logger.info(`Scheduled follow-ups for lead ${leadId} in factory ${factoryId}`);
    }

    /**
     * Cancel all pending follow-ups for a lead (when customer responds)
     */
    public async cancelPendingFollowUps(leadId: string) {
        const pendingFollowUps = await prisma.followUp.findMany({
            where: { leadId, status: FollowUpStatus.PENDING },
        });

        if (pendingFollowUps.length === 0) return;

        // Update status to CANCELLED
        await prisma.followUp.updateMany({
            where: { leadId, status: FollowUpStatus.PENDING },
            data: { status: FollowUpStatus.CANCELLED },
        });

        // Remove scheduled BullMQ jobs
        for (const fu of pendingFollowUps) {
            try {
                const job = await followUpQueue.getJob(`followup-${fu.id}`);
                if (job) await job.remove();
            } catch (e) {
                logger.warn(`Could not remove job for follow-up ${fu.id}: ${(e as Error).message}`);
            }
        }

        logger.info(`Cancelled ${pendingFollowUps.length} pending follow-ups for lead ${leadId}`);
    }

    /**
     * Process a follow-up: verify conditions and send message
     */
    public async processFollowUp(followUpId: string) {
        const followUp = await prisma.followUp.findUnique({
            where: { id: followUpId },
            include: {
                lead: true,
                factory: true,
            },
        });

        if (!followUp) {
            logger.warn(`Follow-up ${followUpId} not found`);
            return;
        }

        // Skip if already sent or cancelled
        if (followUp.status !== FollowUpStatus.PENDING) {
            logger.info(`Follow-up ${followUpId} already ${followUp.status}, skipping`);
            return;
        }

        // Check if factory still has follow-ups enabled
        if (!followUp.factory.followUpsEnabled) {
            await prisma.followUp.update({
                where: { id: followUpId },
                data: { status: FollowUpStatus.CANCELLED },
            });
            logger.info(`Follow-up ${followUpId} cancelled — factory disabled follow-ups`);
            return;
        }

        // Check if customer has responded since the follow-up was created
        const recentCustomerMessage = await prisma.message.findFirst({
            where: {
                leadId: followUp.leadId,
                sender: 'CUSTOMER',
                timestamp: { gt: followUp.createdAt },
            },
            orderBy: { timestamp: 'desc' },
        });

        if (recentCustomerMessage) {
            // Customer responded — cancel this and remaining follow-ups
            await this.cancelPendingFollowUps(followUp.leadId);
            logger.info(`Follow-up ${followUpId} cancelled — customer responded`);
            return;
        }

        // Send the WhatsApp message
        try {
            const message = followUp.message || DEFAULT_TEMPLATES[followUp.followUpNumber]?.replace('{factoryName}', followUp.factory.factoryName) || 'Follow-up message';

            await whatsappService.sendTextMessage(followUp.factoryId, followUp.lead.customerPhone, message);

            // Mark as sent
            await prisma.followUp.update({
                where: { id: followUpId },
                data: {
                    status: FollowUpStatus.SENT,
                    sentAt: new Date(),
                },
            });

            // Store the message in Messages table
            await prisma.message.create({
                data: {
                    leadId: followUp.leadId,
                    factoryId: followUp.factoryId,
                    content: message,
                    sender: 'BOT',
                    timestamp: new Date(),
                },
            });

            logger.info(`Follow-up ${followUp.followUpNumber} sent for lead ${followUp.leadId}`);
        } catch (error) {
            logger.error(`Failed to send follow-up ${followUpId}: ${(error as Error).message}`);
            throw error; // Let BullMQ handle retry
        }
    }

    /**
     * Get follow-up settings for a factory
     */
    public async getSettings(factoryId: string) {
        const factory = await prisma.factory.findUnique({
            where: { id: factoryId },
            select: {
                followUpsEnabled: true,
                followUp1Enabled: true,
                followUp2Enabled: true,
                followUp3Enabled: true,
                followUp1Delay: true,
                followUp2Delay: true,
                followUp3Delay: true,
                followUp1Message: true,
                followUp2Message: true,
                followUp3Message: true,
            },
        });

        if (!factory) throw new Error('Factory not found');

        return {
            followUpsEnabled: factory.followUpsEnabled,
            followUps: [
                {
                    number: 1,
                    enabled: factory.followUp1Enabled,
                    delaySeconds: factory.followUp1Delay,
                    message: factory.followUp1Message || DEFAULT_TEMPLATES[1],
                },
                {
                    number: 2,
                    enabled: factory.followUp2Enabled,
                    delaySeconds: factory.followUp2Delay,
                    message: factory.followUp2Message || DEFAULT_TEMPLATES[2],
                },
                {
                    number: 3,
                    enabled: factory.followUp3Enabled,
                    delaySeconds: factory.followUp3Delay,
                    message: factory.followUp3Message || DEFAULT_TEMPLATES[3],
                },
            ],
        };
    }

    /**
     * Update follow-up settings for a factory
     */
    public async updateSettings(factoryId: string, data: {
        followUpsEnabled?: boolean;
        followUps?: Array<{
            number: number;
            enabled?: boolean;
            delaySeconds?: number;
            message?: string;
        }>;
    }) {
        const updateData: any = {};

        if (data.followUpsEnabled !== undefined) {
            updateData.followUpsEnabled = data.followUpsEnabled;
        }

        if (data.followUps) {
            for (const fu of data.followUps) {
                if (fu.number === 1) {
                    if (fu.enabled !== undefined) updateData.followUp1Enabled = fu.enabled;
                    if (fu.delaySeconds !== undefined) updateData.followUp1Delay = fu.delaySeconds;
                    if (fu.message !== undefined) updateData.followUp1Message = fu.message;
                } else if (fu.number === 2) {
                    if (fu.enabled !== undefined) updateData.followUp2Enabled = fu.enabled;
                    if (fu.delaySeconds !== undefined) updateData.followUp2Delay = fu.delaySeconds;
                    if (fu.message !== undefined) updateData.followUp2Message = fu.message;
                } else if (fu.number === 3) {
                    if (fu.enabled !== undefined) updateData.followUp3Enabled = fu.enabled;
                    if (fu.delaySeconds !== undefined) updateData.followUp3Delay = fu.delaySeconds;
                    if (fu.message !== undefined) updateData.followUp3Message = fu.message;
                }
            }
        }

        await prisma.factory.update({
            where: { id: factoryId },
            data: updateData,
        });

        return this.getSettings(factoryId);
    }
}

export const followUpService = new FollowUpService();
