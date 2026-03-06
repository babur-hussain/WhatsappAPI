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

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to send WhatsApp message: ${response.statusText} - ${errorBody}`);
        }

        return response.json();
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
}

export const whatsappService = new WhatsAppService();
