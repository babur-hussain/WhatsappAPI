import prisma from '../config/database';
import { whatsappService } from './whatsapp.service';
import { logger } from '../config/logger';

export class ExternalService {
    /**
     * Validate an API key and return the factory ID.
     * Used by the external API middleware.
     */
    async validateApiKey(apiKey: string): Promise<string | null> {
        const factory = await prisma.factory.findUnique({
            where: { apiKey },
            select: { id: true, isActive: true, isWhatsappConnected: true },
        });

        if (!factory || !factory.isActive) {
            return null;
        }

        return factory.id;
    }

    /**
     * Send a plain text WhatsApp message via the factory's connected WhatsApp number.
     * Called by external partners like RestaurantSystem.
     * Logs every message to ExternalMessageLog for audit trail.
     */
    async sendMessage(factoryId: string, to: string, message: string, correlationId?: string): Promise<any> {
        // Validate that WhatsApp is connected for this factory
        const factory = await prisma.factory.findUnique({
            where: { id: factoryId },
            select: { isWhatsappConnected: true },
        });

        if (!factory?.isWhatsappConnected) {
            throw new Error('WhatsApp is not connected for this factory. Please connect your WhatsApp number first.');
        }

        // Normalize phone number: ensure country code prefix
        const normalizedPhone = this.normalizePhoneNumber(to);

        // Create audit log entry
        const logEntry = await prisma.externalMessageLog.create({
            data: {
                factoryId,
                to: normalizedPhone,
                messageType: 'text',
                content: message.substring(0, 4096), // Truncate for safety
                status: 'QUEUED',
                correlationId,
            },
        });

        try {
            // Send via LoomiFlow's WhatsApp service (Meta Cloud API)
            const result = await whatsappService.sendTextMessage(factoryId, normalizedPhone, message);
            const metaMessageId = result?.messages?.[0]?.id || null;

            // Update log with success
            await prisma.externalMessageLog.update({
                where: { id: logEntry.id },
                data: {
                    status: 'SENT',
                    metaMessageId,
                },
            });

            return {
                success: true,
                messageId: metaMessageId,
                logId: logEntry.id,
                to: normalizedPhone,
            };
        } catch (error: any) {
            // Update log with failure
            await prisma.externalMessageLog.update({
                where: { id: logEntry.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error.message?.substring(0, 500),
                },
            });

            throw error;
        }
    }

    /**
     * Send a template WhatsApp message via the factory's connected WhatsApp number.
     * Templates are pre-approved by Meta and required for business-initiated conversations.
     */
    async sendTemplate(
        factoryId: string,
        to: string,
        templateName: string,
        languageCode: string = 'en',
        components?: any[],
        correlationId?: string
    ): Promise<any> {
        const factory = await prisma.factory.findUnique({
            where: { id: factoryId },
            select: { isWhatsappConnected: true },
        });

        if (!factory?.isWhatsappConnected) {
            throw new Error('WhatsApp is not connected for this factory.');
        }

        const normalizedPhone = this.normalizePhoneNumber(to);

        // Create audit log entry
        const logEntry = await prisma.externalMessageLog.create({
            data: {
                factoryId,
                to: normalizedPhone,
                messageType: 'template',
                content: `template:${templateName}|lang:${languageCode}`,
                status: 'QUEUED',
                correlationId,
            },
        });

        try {
            const result = await whatsappService.sendTemplateMessage(
                factoryId,
                normalizedPhone,
                templateName,
                languageCode,
                components
            );

            const metaMessageId = result?.messages?.[0]?.id || null;

            await prisma.externalMessageLog.update({
                where: { id: logEntry.id },
                data: {
                    status: 'SENT',
                    metaMessageId,
                },
            });

            return {
                success: true,
                messageId: metaMessageId,
                logId: logEntry.id,
                to: normalizedPhone,
                templateName,
            };
        } catch (error: any) {
            await prisma.externalMessageLog.update({
                where: { id: logEntry.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error.message?.substring(0, 500),
                },
            });

            throw error;
        }
    }

    /**
     * Send a document/media WhatsApp message.
     */
    async sendDocument(
        factoryId: string,
        to: string,
        documentUrl: string,
        caption: string,
        correlationId?: string
    ): Promise<any> {
        const factory = await prisma.factory.findUnique({
            where: { id: factoryId },
            select: { isWhatsappConnected: true },
        });

        if (!factory?.isWhatsappConnected) {
            throw new Error('WhatsApp is not connected for this factory.');
        }

        const normalizedPhone = this.normalizePhoneNumber(to);

        const logEntry = await prisma.externalMessageLog.create({
            data: {
                factoryId,
                to: normalizedPhone,
                messageType: 'document',
                content: `url:${documentUrl}|caption:${caption}`.substring(0, 4096),
                status: 'QUEUED',
                correlationId,
            },
        });

        try {
            const result = await whatsappService.sendDocumentMessage(factoryId, normalizedPhone, documentUrl, caption);
            const metaMessageId = result?.messages?.[0]?.id || null;

            await prisma.externalMessageLog.update({
                where: { id: logEntry.id },
                data: { status: 'SENT', metaMessageId },
            });

            return {
                success: true,
                messageId: metaMessageId,
                logId: logEntry.id,
                to: normalizedPhone,
            };
        } catch (error: any) {
            await prisma.externalMessageLog.update({
                where: { id: logEntry.id },
                data: { status: 'FAILED', errorMessage: error.message?.substring(0, 500) },
            });
            throw error;
        }
    }

    /**
     * Get message status by log ID or Meta message ID.
     */
    async getMessageStatus(factoryId: string, messageId: string): Promise<any> {
        const log = await prisma.externalMessageLog.findFirst({
            where: {
                factoryId,
                OR: [
                    { id: messageId },
                    { metaMessageId: messageId },
                    { correlationId: messageId },
                ],
            },
            select: {
                id: true,
                to: true,
                messageType: true,
                status: true,
                metaMessageId: true,
                errorMessage: true,
                correlationId: true,
                deliveredAt: true,
                readAt: true,
                createdAt: true,
            },
        });

        if (!log) {
            return null;
        }

        return log;
    }

    /**
     * Update delivery status from Meta webhook callback.
     * Called when Meta sends a status update (delivered, read, failed).
     */
    async updateDeliveryStatus(
        metaMessageId: string,
        status: 'DELIVERED' | 'READ' | 'FAILED',
        errorMessage?: string
    ): Promise<void> {
        const log = await prisma.externalMessageLog.findFirst({
            where: { metaMessageId },
        });

        if (!log) {
            logger.debug(`[External] No log found for Meta message ID: ${metaMessageId}`);
            return;
        }

        const updateData: any = { status };
        if (status === 'DELIVERED') updateData.deliveredAt = new Date();
        if (status === 'READ') updateData.readAt = new Date();
        if (errorMessage) updateData.errorMessage = errorMessage.substring(0, 500);

        await prisma.externalMessageLog.update({
            where: { id: log.id },
            data: updateData,
        });

        // If the factory has a webhookUrl configured, forward the status update
        const factory = await prisma.factory.findUnique({
            where: { id: log.factoryId },
            select: { webhookUrl: true, webhookSecret: true },
        });

        if (factory?.webhookUrl) {
            this.forwardStatusWebhook(factory.webhookUrl, factory.webhookSecret, {
                event: 'message.status',
                messageId: log.id,
                metaMessageId,
                to: log.to,
                status,
                correlationId: log.correlationId,
                timestamp: new Date().toISOString(),
            }).catch(err => logger.error(`[External] Webhook forward failed: ${err.message}`));
        }
    }

    /**
     * Forward a delivery status to the factory's configured webhook URL.
     * Signed with HMAC-SHA256 using the factory's webhookSecret.
     */
    private async forwardStatusWebhook(
        webhookUrl: string,
        webhookSecret: string | null,
        payload: any
    ): Promise<void> {
        const bodyStr = JSON.stringify(payload);
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Sign the webhook payload if a secret is configured
        if (webhookSecret) {
            const crypto = await import('crypto');
            const signature = crypto
                .createHmac('sha256', webhookSecret)
                .update(bodyStr)
                .digest('hex');
            headers['x-webhook-signature'] = signature;
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: bodyStr,
            signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
            throw new Error(`Webhook delivery failed: ${response.status}`);
        }
    }

    /**
     * Normalize Indian phone numbers to the E.164 format required by Meta Cloud API.
     * Handles: 9876543210, +919876543210, 919876543210
     */
    private normalizePhoneNumber(phone: string): string {
        const cleaned = phone.replace(/[\s\-()]/g, '');

        // Already has country code with +
        if (cleaned.startsWith('+')) {
            return cleaned.replace('+', ''); // Meta API wants no + prefix
        }

        // Already has country code without +
        if (cleaned.startsWith('91') && cleaned.length === 12) {
            return cleaned;
        }

        // Bare 10-digit Indian mobile
        if (/^[6-9]\d{9}$/.test(cleaned)) {
            return `91${cleaned}`;
        }

        // Return as-is for other formats (international numbers etc.)
        return cleaned;
    }
}

export const externalService = new ExternalService();
