import prisma from '../config/database';
import { decrypt } from '../utils/crypto.util';
import { whatsappService } from './whatsapp.service';
import { broadcastQueue } from '../config/queue';
import { logger } from '../config/logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TemplateComponent {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    example?: any;
    buttons?: TemplateButton[];
}

export interface TemplateButton {
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
    text: string;
    url?: string;
    phone_number?: string;
    example?: string[];
}

export interface CreateTemplateData {
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language: string;
    components: TemplateComponent[];
    allow_category_change?: boolean;
}

export interface SendTemplateData {
    to: string;
    templateName: string;
    languageCode: string;
    components?: any[];
    templateContent?: string;
}

export interface BulkSendTemplateData {
    templateName: string;
    languageCode: string;
    components?: any[];
    targetType: 'ALL_LEADS' | 'NEW_LEADS' | 'CONTACTED_LEADS';
    templateContent?: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

export class TemplateService {
    private readonly API_VERSION = 'v21.0';

    /**
     * Get factory's WhatsApp Business Account credentials
     */
    private async getFactoryWABA(factoryId: string) {
        const factory = await prisma.factory.findUnique({
            where: { id: factoryId },
            select: {
                whatsappBusinessAccountId: true,
                whatsappAccessToken: true,
                whatsappPhoneNumberId: true,
                isWhatsappConnected: true,
            },
        });

        if (!factory) throw new Error('Factory not found');
        if (!factory.whatsappBusinessAccountId || !factory.whatsappAccessToken) {
            throw new Error('WhatsApp Business Account is not configured. Please connect your WhatsApp first and ensure Business Account ID is set.');
        }

        return {
            wabaId: factory.whatsappBusinessAccountId,
            accessToken: decrypt(factory.whatsappAccessToken),
            phoneNumberId: factory.whatsappPhoneNumberId,
        };
    }

    /**
     * Upload a sample media file to Meta's Resumable Upload API to get a valid header_handle.
     * Meta requires this for template creation with media headers (IMAGE, VIDEO, DOCUMENT).
     *
     * Steps:
     * 1. Get the App ID from the access token
     * 2. Create an upload session
     * 3. Upload a small sample file
     * 4. Return the handle
     */
    private async uploadSampleMedia(accessToken: string, format: string): Promise<string> {
        const MIME_TYPES: Record<string, string> = {
            IMAGE: 'image/png',
            VIDEO: 'video/mp4',
            DOCUMENT: 'application/pdf',
        };

        const mimeType = MIME_TYPES[format] || MIME_TYPES.IMAGE;

        // Step 1: Get the App ID by inspecting the token
        const debugRes = await fetch(
            `https://graph.facebook.com/${this.API_VERSION}/debug_token?input_token=${accessToken}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const debugData = await debugRes.json();
        const appId = debugData?.data?.app_id;

        if (!appId) {
            throw new Error('Could not determine Facebook App ID from access token. Please check your WhatsApp configuration.');
        }

        // Step 2: Create an upload session
        const sessionRes = await fetch(
            `https://graph.facebook.com/${this.API_VERSION}/${appId}/uploads`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file_length: format === 'IMAGE' ? 67 : 1024, // small sample
                    file_type: mimeType,
                }),
            }
        );

        const sessionData = await sessionRes.json();
        
        if (!sessionData.id) {
            logger.error(`Upload session creation failed: ${JSON.stringify(sessionData)}`);
            throw new Error(`Failed to create upload session: ${sessionData?.error?.message || 'Unknown error'}`);
        }

        const uploadSessionId = sessionData.id;

        // Step 3: Create a minimal valid sample file and upload it
        let fileBuffer: Buffer;
        if (format === 'IMAGE') {
            // Minimal valid 1x1 PNG (67 bytes)
            fileBuffer = Buffer.from(
                '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489' +
                '0000000a49444154789c626000000002000198e195280000000049454e44ae426082',
                'hex'
            );
        } else if (format === 'VIDEO') {
            // Minimal MP4 header — Meta just needs a valid file for the sample
            fileBuffer = Buffer.alloc(1024, 0);
            // Write ftyp box header
            fileBuffer.write('\x00\x00\x00\x1cftypisom', 0, 'binary');
        } else {
            // Minimal PDF
            fileBuffer = Buffer.from(
                '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
                '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
                '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n' +
                'xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n' +
                '0000000058 00000 n \n0000000115 00000 n \n' +
                'trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF',
                'utf-8'
            );
        }

        // Step 4: Upload the file (convert Buffer to Uint8Array for fetch compatibility)
        const uploadRes = await fetch(
            `https://graph.facebook.com/${this.API_VERSION}/${uploadSessionId}`,
            {
                method: 'POST',
                headers: {
                    Authorization: `OAuth ${accessToken}`,
                    file_offset: '0',
                    'Content-Type': mimeType,
                },
                body: new Uint8Array(fileBuffer),
            }
        );

        const uploadData = await uploadRes.json();

        if (!uploadData.h) {
            logger.error(`File upload failed: ${JSON.stringify(uploadData)}`);
            throw new Error(`Failed to upload sample media: ${uploadData?.error?.message || 'Unknown error'}`);
        }

        logger.info(`Sample media uploaded successfully for ${format} header, handle: ${uploadData.h.substring(0, 20)}...`);
        return uploadData.h;
    }

    /**
     * Process components to ensure media headers have valid header_handle from Meta Upload API.
     */
    private async ensureHeaderExamplesAsync(components: TemplateComponent[], accessToken: string): Promise<TemplateComponent[]> {
        const result: TemplateComponent[] = [];

        for (const comp of components) {
            if (
                comp.type === 'HEADER' &&
                comp.format &&
                ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(comp.format)
            ) {
                // Check if the existing handle is a valid Meta handle (not a URL)
                const existingHandle = comp.example?.header_handle?.[0];
                const isValidHandle = existingHandle && !existingHandle.startsWith('http');

                if (isValidHandle) {
                    logger.info(`Header already has a valid Meta handle, skipping upload`);
                    result.push(comp);
                } else {
                    logger.info(`Uploading sample media for ${comp.format} header to get Meta handle...`);
                    try {
                        const handle = await this.uploadSampleMedia(accessToken, comp.format);
                        result.push({
                            ...comp,
                            example: { header_handle: [handle] },
                        });
                    } catch (err) {
                        logger.error(`Failed to upload sample media for ${comp.format} header: ${(err as Error).message}`);
                        throw err;
                    }
                }
            } else {
                result.push(comp);
            }
        }

        return result;
    }

    // ─── List Templates ─────────────────────────────────────────────────────

    public async getTemplates(factoryId: string, filters?: {
        status?: string;
        category?: string;
        name?: string;
        limit?: number;
        after?: string;
    }) {
        const { wabaId, accessToken } = await this.getFactoryWABA(factoryId);

        const params = new URLSearchParams();
        params.append('limit', String(filters?.limit || 100));
        if (filters?.status) params.append('status', filters.status);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.name) params.append('name', filters.name);
        if (filters?.after) params.append('after', filters.after);
        params.append('fields', 'id,name,category,language,status,components,quality_score,rejected_reason');

        const url = `https://graph.facebook.com/${this.API_VERSION}/${wabaId}/message_templates?${params.toString()}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Failed to fetch templates: ${response.statusText} - ${errBody}`);
        }

        const data = await response.json();
        return {
            templates: data.data || [],
            paging: data.paging || null,
        };
    }

    // ─── Get Single Template ────────────────────────────────────────────────

    public async getTemplate(factoryId: string, templateId: string) {
        const { accessToken } = await this.getFactoryWABA(factoryId);

        const url = `https://graph.facebook.com/${this.API_VERSION}/${templateId}?fields=id,name,category,language,status,components,quality_score,rejected_reason`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Failed to fetch template: ${response.statusText} - ${errBody}`);
        }

        return response.json();
    }

    // ─── Create Template ────────────────────────────────────────────────────

    public async createTemplate(factoryId: string, data: CreateTemplateData) {
        const { wabaId, accessToken } = await this.getFactoryWABA(factoryId);

        // Upload sample media for any media headers (IMAGE/VIDEO/DOCUMENT) to get valid handles
        const processedComponents = await this.ensureHeaderExamplesAsync(data.components, accessToken);

        const payload: any = {
            name: data.name,
            category: data.category,
            language: data.language,
            components: processedComponents,
        };

        if (data.allow_category_change !== undefined) {
            payload.allow_category_change = data.allow_category_change;
        }

        const url = `https://graph.facebook.com/${this.API_VERSION}/${wabaId}/message_templates`;

        logger.info(`Creating template "${data.name}" with payload: ${JSON.stringify(payload, null, 2)}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            let message = errBody?.error?.message || response.statusText;
            if (errBody?.error?.error_data?.details) {
                message += ` - ${errBody.error.error_data.details}`;
            } else if (errBody?.error?.error_user_title) {
                message += ` - ${errBody.error.error_user_title}: ${errBody.error.error_user_msg}`;
            }
            logger.error(`Template creation failed: ${JSON.stringify(errBody)}`);
            throw new Error(`Failed to create template: ${message}`);
        }

        return response.json();
    }

    // ─── Update Template ────────────────────────────────────────────────────

    public async updateTemplate(factoryId: string, templateId: string, data: {
        components?: TemplateComponent[];
        category?: string;
    }) {
        const { accessToken } = await this.getFactoryWABA(factoryId);

        const url = `https://graph.facebook.com/${this.API_VERSION}/${templateId}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            const message = errBody?.error?.message || response.statusText;
            throw new Error(`Failed to update template: ${message}`);
        }

        return response.json();
    }

    // ─── Delete Template ────────────────────────────────────────────────────

    public async deleteTemplate(factoryId: string, templateName: string) {
        const { wabaId, accessToken } = await this.getFactoryWABA(factoryId);

        const url = `https://graph.facebook.com/${this.API_VERSION}/${wabaId}/message_templates?name=${encodeURIComponent(templateName)}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            const message = errBody?.error?.message || response.statusText;
            throw new Error(`Failed to delete template: ${message}`);
        }

        return response.json();
    }

    // ─── Send Template to Single Contact ────────────────────────────────────

    public async sendTemplate(factoryId: string, data: SendTemplateData) {
        // Send via WhatsApp API
        const result = await whatsappService.sendTemplateMessage(
            factoryId,
            data.to,
            data.templateName,
            data.languageCode,
            data.components,
        );

        // Store the sent message in the database so it appears in Conversations
        try {
            // Find or create a lead for this phone number
            let lead = await prisma.lead.findUnique({
                where: {
                    factoryId_customerPhone: {
                        factoryId,
                        customerPhone: data.to,
                    },
                },
            });

            if (!lead) {
                lead = await prisma.lead.create({
                    data: {
                        factoryId,
                        customerPhone: data.to,
                        lastMessage: `[Template: ${data.templateName}]`,
                        status: 'NEW',
                        source: 'WHATSAPP',
                    },
                });
            }

            const messageContent = data.templateContent || `[Template: ${data.templateName}]`;

            // Store the message
            await prisma.message.create({
                data: {
                    leadId: lead.id,
                    factoryId,
                    content: messageContent,
                    sender: 'BOT',
                    timestamp: new Date(),
                },
            });

            // Update lead's last message
            await prisma.lead.update({
                where: { id: lead.id },
                data: { lastMessage: messageContent, updatedAt: new Date() },
            });
        } catch (storeError) {
            // Log but don't fail the send — the message was already sent successfully
            logger.error(`Failed to store sent template message: ${(storeError as Error).message}`);
        }

        return result;
    }

    // ─── Bulk Send Template ─────────────────────────────────────────────────

    public async bulkSendTemplate(factoryId: string, data: BulkSendTemplateData) {
        let whereClause: any = { factoryId };

        if (data.targetType === 'NEW_LEADS') {
            whereClause.status = 'NEW';
        } else if (data.targetType === 'CONTACTED_LEADS') {
            whereClause.status = 'CONTACTED';
        }

        const leads = await prisma.lead.findMany({
            where: whereClause,
            select: { id: true, customerPhone: true, customerName: true },
        });

        if (leads.length === 0) {
            throw new Error(`No recipients found for target type: ${data.targetType}`);
        }

        if (leads.length > 5000) {
            throw new Error('Bulk send size exceeds the limit of 5000 recipients.');
        }

        // Create a broadcast record for tracking
        const broadcast = await prisma.broadcast.create({
            data: {
                factoryId,
                title: `Template: ${data.templateName}`,
                message: data.templateContent || `[Template] ${data.templateName} (${data.languageCode})`,
                targetType: data.targetType,
                status: 'SENDING',
                totalRecipients: leads.length,
            },
        });

        // Create recipients
        const recipientData = leads.map(lead => ({
            broadcastId: broadcast.id,
            leadId: lead.id,
            phoneNumber: lead.customerPhone,
            status: 'PENDING' as const,
        }));

        await prisma.broadcastRecipient.createMany({ data: recipientData });

        const recipients = await prisma.broadcastRecipient.findMany({
            where: { broadcastId: broadcast.id, status: 'PENDING' },
            select: { id: true, leadId: true, phoneNumber: true },
        });

        // Enqueue each recipient for template send
        for (const recipient of recipients) {
            await broadcastQueue.add(
                'processTemplateSend',
                {
                    broadcastId: broadcast.id,
                    recipientId: recipient.id,
                    factoryId,
                    templateName: data.templateName,
                    languageCode: data.languageCode,
                    components: data.components || [],
                    templateContent: data.templateContent,
                    phoneNumber: recipient.phoneNumber,
                    leadId: recipient.leadId,
                },
                {
                    jobId: `template-${recipient.id}`,
                    attempts: 2,
                    backoff: { type: 'exponential', delay: 2000 },
                    removeOnComplete: true,
                    removeOnFail: false,
                }
            );
        }

        return {
            broadcastId: broadcast.id,
            totalRecipients: leads.length,
            status: 'SENDING',
        };
    }

    /**
     * Process a single template send recipient (called by BullMQ worker)
     */
    public async processTemplateSendRecipient(data: {
        broadcastId: string;
        recipientId: string;
        factoryId: string;
        templateName: string;
        languageCode: string;
        components: any[];
        templateContent?: string;
        phoneNumber: string;
        leadId: string;
    }) {
        const { broadcastId, recipientId, factoryId, templateName, languageCode, components, templateContent, phoneNumber, leadId } = data;

        try {
            await whatsappService.sendTemplateMessage(factoryId, phoneNumber, templateName, languageCode, components);

            await prisma.broadcastRecipient.update({
                where: { id: recipientId },
                data: { status: 'SENT', sentAt: new Date() },
            });

            const messageContent = templateContent || `[Template: ${templateName}]`;

            await prisma.message.create({
                data: {
                    leadId,
                    factoryId,
                    content: messageContent,
                    sender: 'BOT',
                    timestamp: new Date(),
                },
            });

            await prisma.broadcast.update({
                where: { id: broadcastId },
                data: { sentCount: { increment: 1 } },
            });
        } catch (error) {
            logger.error(`Template send to ${phoneNumber} failed: ${(error as Error).message}`);

            await prisma.broadcastRecipient.update({
                where: { id: recipientId },
                data: { status: 'FAILED', error: (error as Error).message },
            });

            await prisma.broadcast.update({
                where: { id: broadcastId },
                data: { failedCount: { increment: 1 } },
            });

            throw error;
        }

        // Check completion
        const broadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } });
        if (broadcast && broadcast.sentCount + broadcast.failedCount >= broadcast.totalRecipients) {
            await prisma.broadcast.update({
                where: { id: broadcastId },
                data: { status: 'COMPLETED' },
            });
            logger.info(`Template bulk send ${broadcastId} completed.`);
        }
    }
}

export const templateService = new TemplateService();
