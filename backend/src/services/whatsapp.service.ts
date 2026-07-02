import prisma from '../config/database';
import { decrypt } from '../utils/crypto.util';

export class WhatsAppService {
    /**
     * Get a factory's WhatsApp credentials from the database
     */
    private async getFactoryCredentials(factoryId: string) {
        const factory = await prisma.factory.findUnique({
            where: { id: factoryId },
            select: {
                whatsappPhoneNumberId: true,
                whatsappAccessToken: true,
                whatsappNumber: true,
                isWhatsappConnected: true,
            },
        });

        if (!factory) {
            throw new Error('Factory not found');
        }

        if (!factory.whatsappPhoneNumberId || !factory.whatsappAccessToken) {
            throw new Error('WhatsApp is not configured for this factory. Please connect your WhatsApp number first.');
        }

        return {
            phoneNumberId: factory.whatsappPhoneNumberId,
            accessToken: decrypt(factory.whatsappAccessToken),
        };
    }

    /**
     * Send a text message via Meta Cloud API using factory-specific credentials
     */
    public async sendTextMessage(factoryId: string, to: string, message: string): Promise<any> {
        const { phoneNumberId, accessToken } = await this.getFactoryCredentials(factoryId);

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: {
                preview_url: false,
                body: message,
            },
        };

        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to send WhatsApp text message');
        }

        return data;
    }

    /**
     * Send a media message via Meta Cloud API using factory-specific credentials
     */
    public async sendMediaMessage(factoryId: string, to: string, url: string, mediaType: 'image' | 'document' | 'video' | 'audio', caption?: string): Promise<any> {
        const { phoneNumberId, accessToken } = await this.getFactoryCredentials(factoryId);

        const payload: any = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: mediaType,
            [mediaType]: {
                link: url,
            }
        };

        if (caption && (mediaType === 'image' || mediaType === 'video' || mediaType === 'document')) {
            payload[mediaType].caption = caption;
        }

        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to send WhatsApp message: ${response.statusText} - ${errorBody}`);
        }

        const result = await response.json();
        return result; // result.messages[0].id contains the wamid
    }

    /**
     * Send a document/media message via Meta Cloud API
     */
    public async sendDocumentMessage(factoryId: string, to: string, documentUrl: string, caption: string): Promise<any> {
        const { phoneNumberId, accessToken } = await this.getFactoryCredentials(factoryId);

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'document',
            document: {
                link: documentUrl,
                caption,
            },
        };

        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to send WhatsApp document: ${response.statusText} - ${errorBody}`);
        }

        return response.json();
    }

    public async getTemplates(factoryId: string, limit: number = 100): Promise<any> {
        const { phoneNumberId, accessToken } = await this.getFactoryCredentials(factoryId);
        
        // Find WABA ID from phoneNumberId
        const factory = await prisma.factory.findFirst({
            where: { whatsappPhoneNumberId: phoneNumberId }
        });
        
        if (!factory || !factory.whatsappBusinessAccountId) {
            throw new Error('WhatsApp Business Account ID not found');
        }

        const response = await fetch(`https://graph.facebook.com/v21.0/${factory.whatsappBusinessAccountId}/message_templates?limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to fetch templates: ${response.statusText} - ${errorBody}`);
        }

        return response.json();
    }

    /**
     * Get WhatsApp Business Profile
     */
    public async getBusinessProfile(factoryId: string): Promise<any> {
        const { phoneNumberId, accessToken } = await this.getFactoryCredentials(factoryId);
        
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to fetch WhatsApp Business Profile: ${response.statusText} - ${errorBody}`);
        }

        return response.json();
    }

    /**
     * Update WhatsApp Business Profile
     */
    public async updateBusinessProfile(factoryId: string, data: { about?: string, address?: string, description?: string, email?: string, websites?: string[], vertical?: string }): Promise<any> {
        const { phoneNumberId, accessToken } = await this.getFactoryCredentials(factoryId);
        
        const payload: any = { messaging_product: 'whatsapp' };
        if (data.about !== undefined) payload.about = data.about;
        if (data.address !== undefined) payload.address = data.address;
        if (data.description !== undefined) payload.description = data.description;
        if (data.email !== undefined) payload.email = data.email;
        if (data.websites !== undefined) payload.websites = data.websites;
        if (data.vertical !== undefined) payload.vertical = data.vertical;

        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/whatsapp_business_profile`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to update WhatsApp Business Profile: ${response.statusText} - ${errorBody}`);
        }

        return response.json();
    }

    /**
     * Send a template message (required for business-initiated conversations)
     */
    public async sendTemplateMessage(factoryId: string, to: string, templateName: string, languageCode: string = 'en', components?: any[]): Promise<any> {
        const { phoneNumberId, accessToken } = await this.getFactoryCredentials(factoryId);

        const payload: any = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode },
            },
        };

        if (components && components.length > 0) {
            payload.template.components = components;
        }

        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to send WhatsApp template: ${response.statusText} - ${errorBody}`);
        }

        return response.json();
    }

    /**
     * Verify WhatsApp credentials by calling the Meta API
     */
    public async verifyConnection(phoneNumberId: string, accessToken: string): Promise<{ success: boolean; phoneNumber?: string; error?: string }> {
        try {
            const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const errorBody = await response.json();
                return {
                    success: false,
                    error: errorBody.error?.message || 'Invalid credentials',
                };
            }

            const data = await response.json();
            return {
                success: true,
                phoneNumber: data.display_phone_number || data.verified_name,
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }

    /**
     * Get the download URL for a media ID from Meta
     */
    public async getMediaUrl(mediaId: string, accessToken: string): Promise<{ url: string; mimeType: string }> {
        const response = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch media metadata: ${errorText}`);
        }

        const data = await response.json();
        return {
            url: data.url,
            mimeType: data.mime_type,
        };
    }

    /**
     * Download binary data from a Meta media URL
     */
    public async downloadMedia(url: string, accessToken: string): Promise<Buffer> {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to download media: ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}

export const whatsappService = new WhatsAppService();
