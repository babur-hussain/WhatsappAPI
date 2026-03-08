import { Request, Response } from 'express';
import { leadService } from '../services/lead.service';
import { followUpService } from '../services/followup.service';
import { notificationService } from '../services/notification.service';
import { enqueueAiReply, enqueueNotification, enqueueMessage } from '../config/queue';
import { getIO } from '../socket/socket.server';
import prisma from '../config/database';
import catchAsync from '../utils/catch-async';
import { decrypt } from '../utils/crypto.util';

/**
 * Fetch the WhatsApp profile picture URL for a given phone number using Meta Cloud API.
 * Returns null if unavailable or the API call fails.
 */
async function fetchProfilePicture(accessToken: string, phoneNumberId: string, waId: string): Promise<string | null> {
    try {
        const res = await fetch(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/contacts?wa_id=${waId}&fields=profile_picture_url`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data?.data?.[0]?.profile_picture_url || null;
    } catch {
        return null;
    }
}

export const verifyWebhook = catchAsync(async (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    // Check if a token and mode were sent
    if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    } else {
        // Return 400 Bad Request if params are missing
        res.sendStatus(400);
    }
});

export const receiveWebhook = catchAsync(async (req: Request, res: Response) => {
    const body = req.body;

    // Check if this is an event from a WhatsApp API
    if (body.object) {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0] &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            console.log('Webhook Received a Message Event:', JSON.stringify(body.entry[0].changes[0].value.messages[0]));
            const metadata = body.entry[0].changes[0].value.metadata;
            const message = body.entry[0].changes[0].value.messages[0];
            // contacts array contains sender display name from WhatsApp
            const contacts = body.entry[0].changes[0].value.contacts || [];
            const contactName: string | undefined = contacts[0]?.profile?.name;

            const businessPhoneNumber = metadata.display_phone_number;
            const phoneNumberId: string = metadata.phone_number_id;
            const customerPhone = message.from; // Sender phone number
            const messageText = message.text?.body || '[Media message]';
            const timestamp = new Date(parseInt(message.timestamp) * 1000);

            // Find the factory by the WhatsApp number or Phone Number ID
            const factory = await prisma.factory.findFirst({
                where: {
                    OR: [
                        { whatsappPhoneNumberId: phoneNumberId },
                        { whatsappNumber: businessPhoneNumber }
                    ]
                },
            });

            if (!factory) {
                console.warn(`Webhook received for unknown business number: ${businessPhoneNumber}`);
                return res.sendStatus(404);
            }

            // Process the message (create/update lead and store message)
            // Pass contactName so it gets saved when a new lead is created
            const { lead, isNewLead } = await leadService.processIncomingMessage({
                factoryId: factory.id,
                customerPhone,
                customerName: contactName,
                messageText,
                timestamp,
            });

            // Fetch and save profile picture asynchronously (non-blocking)
            if (isNewLead && factory.whatsappAccessToken) {
                const accessToken = decrypt(factory.whatsappAccessToken);
                fetchProfilePicture(accessToken, phoneNumberId, customerPhone).then(async (url) => {
                    if (url) {
                        await prisma.lead.update({
                            where: { id: lead.id },
                            data: { profilePicture: url },
                        });
                    }
                }).catch(() => { /* silently ignore */ });
            }

            // Real-time update to frontend via WebSockets
            const io = getIO();
            if (io) {
                const messagePayload = {
                    leadId: lead.id,
                    message: {
                        id: Math.random().toString(36).substring(7), // Temporary ID until DB save if not available
                        content: messageText,
                        sender: 'CUSTOMER',
                        timestamp: timestamp.toISOString()
                    },
                    lead: {
                        id: lead.id,
                        customerPhone: lead.customerPhone,
                        customerName: lead.customerName,
                        profilePicture: lead.profilePicture,
                        status: lead.status,
                        lastMessage: messageText,
                        lastMessageSender: 'CUSTOMER',
                        lastMessageTime: timestamp.toISOString(),
                        messageCount: 1, // Example
                        unreadCount: (lead as any).unreadCount
                    }
                };
                console.log(`Emitting new_message to room factory:${factory.id}`);
                io.to(`factory:${factory.id}`).emit('new_message', messagePayload);
                // Also emit globally for debugging
                io.emit('new_message', messagePayload);
            }

            if (isNewLead) {
                // Determine Sales team numbers for alerts
                const salesUsers = await prisma.user.findMany({
                    where: { factoryId: factory.id, role: { in: ['FACTORY_ADMIN', 'SALES'] } },
                    select: { phone: true }
                });
                const adminPhones = salesUsers.map((u: any) => u.phone).filter(Boolean);

                const alertMsg = `*New Lead Received*\n\nCustomer: +${customerPhone}\nMessage: ${messageText}\n\nOpen dashboard to respond immediately.`;

                // Queue notification events (socket + WhatsApp alerts)
                await enqueueNotification({
                    factoryId: factory.id,
                    event: 'new_lead',
                    payload: {
                        leadId: lead.id,
                        customerPhone,
                        text: alertMsg,
                        lastMessage: messageText,
                        createdAt: lead.createdAt
                    },
                    adminAlerts: adminPhones
                });

                // Auto Send Catalog if available
                const latestCatalog = await prisma.catalog.findFirst({
                    where: { factoryId: factory.id },
                    orderBy: { createdAt: 'desc' },
                });

                let contextStr = '';
                if (latestCatalog) {
                    contextStr = `The factory has a catalog available at ${latestCatalog.fileUrl}. Mention they can view it.`;
                }

                if (factory.autoReplyEnabled) {
                    if (factory.autoReplyType === 'AI') {
                        // Queue AI Smart Reply
                        await enqueueAiReply({
                            factoryId: factory.id,
                            customerPhone,
                            messageText,
                            context: contextStr
                        });
                    } else if (factory.autoReplyType === 'STATIC') {
                        const staticText = factory.autoReplyStaticMessage || 'Thank you for your message! Our team will get back to you shortly.';
                        await enqueueMessage({
                            factoryId: factory.id,
                            to: customerPhone,
                            text: staticText,
                            type: 'text'
                        });
                        
                        await leadService.processOutgoingMessage({
                            leadId: lead.id,
                            factoryId: factory.id,
                            content: staticText,
                            sender: 'BOT',
                            timestamp: new Date()
                        });
                    }
                }

                // Create internal notification
                await notificationService.createNewLeadNotification(factory.id, customerPhone);

                // Schedule follow-up messages
                await followUpService.scheduleFollowUps(lead.id, factory.id);
            } else {
                // Cancel pending follow-ups since customer responded
                await followUpService.cancelPendingFollowUps(lead.id);

                if (factory.autoReplyEnabled) {
                    if (factory.autoReplyType === 'AI') {
                        // For existing leads, queue AI reply to continue conversation
                        await enqueueAiReply({
                            factoryId: factory.id,
                            customerPhone,
                            messageText,
                            context: 'Customer is continuing conversation. Be helpful.'
                        });
                    } else if (factory.autoReplyType === 'STATIC') {
                        // Always send the static reply to old leads as well, as requested
                        const staticText = factory.autoReplyStaticMessage || 'Thank you for your message! Our team will get back to you shortly.';
                        await enqueueMessage({
                            factoryId: factory.id,
                            to: customerPhone,
                            text: staticText,
                            type: 'text'
                        });
                        
                        await leadService.processOutgoingMessage({
                            leadId: lead.id,
                            factoryId: factory.id,
                            content: staticText,
                            sender: 'BOT',
                            timestamp: new Date()
                        });
                    }
                }
            }
        }

        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});
