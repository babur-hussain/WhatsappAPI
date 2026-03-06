import { Worker, Job } from 'bullmq';
import { redis } from './redis';
import { whatsappService } from '../services/whatsapp.service';
import { aiService } from '../services/ai.service';
import { followUpService } from '../services/followup.service';
import { broadcastService } from '../services/broadcast.service';
import { leadService } from '../services/lead.service';
import prisma from './database';
import { getIO } from '../socket/socket.server';
import { SenderType } from '@prisma/client';

// Initialize Workers
export const initWorkers = () => {
    // 1. AI Reply Worker
    const aiWorker = new Worker('aiQueue', async (job: Job) => {
        const { factoryId, customerPhone, messageText, context } = job.data;

        // Generate smart reply
        const reply = await aiService.generateSmartReply(factoryId, messageText, context);

        // Send via WhatsApp
        await whatsappService.sendTextMessage(factoryId, customerPhone, reply);

        // Store the outgoing AI reply in conversation history
        const lead = await prisma.lead.findFirst({
            where: { factoryId, customerPhone },
            orderBy: { createdAt: 'desc' }
        });

        if (lead) {
            await leadService.processOutgoingMessage({
                leadId: lead.id,
                factoryId,
                content: reply,
                sender: SenderType.BOT,
                timestamp: new Date()
            });
        }

    }, { connection: redis });

    aiWorker.on('failed', (job, err) => {
        console.error(`AI Job failed for ${job?.id}: ${err.message}`);
    });

    // 2. Message Queue for generic WhatsApp sending
    const msgWorker = new Worker('messageQueue', async (job: Job) => {
        const { factoryId, to, text, type, mediaUrl, caption } = job.data;

        if (type === 'text') {
            await whatsappService.sendTextMessage(factoryId, to, text);
        } else if (type === 'document' && mediaUrl) {
            await whatsappService.sendDocumentMessage(factoryId, to, mediaUrl, caption);
        }
    }, { connection: redis });

    msgWorker.on('failed', (job, err) => {
        console.error(`Message Job failed for ${job?.id}: ${err.message}`);
    });

    // 3. Notification Queue for sending internal socket alerts & admin alerts
    const notificationWorker = new Worker('notificationQueue', async (job: Job) => {
        const { factoryId, event, payload, adminAlerts } = job.data;

        // Emit real-time event
        try {
            getIO().to(`factory:${factoryId}`).emit(event, payload);
        } catch (e) { /* ignore */ }

        // Send Admin WhatsApp Alerts if requested
        if (adminAlerts && adminAlerts.length > 0) {
            for (const adminPhone of adminAlerts) {
                try {
                    await whatsappService.sendTextMessage(factoryId, adminPhone, payload.text);
                } catch (e) {
                    console.error(`Admin alert to ${adminPhone} failed:`, (e as Error).message);
                }
            }
        }
    }, { connection: redis });

    // 4. Follow-Up Worker
    const followUpWorker = new Worker('followUpQueue', async (job: Job) => {
        const { followUpId } = job.data;
        await followUpService.processFollowUp(followUpId);
    }, {
        connection: redis,
        concurrency: 5,
    });

    followUpWorker.on('failed', (job, err) => {
        console.error(`Follow-up Job failed for ${job?.id}: ${err.message}`);
    });

    followUpWorker.on('completed', (job) => {
        console.log(`Follow-up Job completed: ${job?.id}`);
    });

    // 5. Broadcast Worker (Rate limited to 20 messages per minute)
    const broadcastWorker = new Worker('broadcastQueue', async (job: Job) => {
        await broadcastService.processRecipient(job.data);
    }, {
        connection: redis,
        limiter: {
            max: 20,
            duration: 60000,
        },
    });

    broadcastWorker.on('failed', (job, err) => {
        console.error(`Broadcast Job failed for ${job?.id}: ${err.message}`);
    });

    broadcastWorker.on('completed', (job) => {
        console.log(`Broadcast Job completed: ${job?.id}`);
    });

    console.log('BullMQ Workers initialized');
};
