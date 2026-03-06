import { Request, Response } from 'express';
import { leadService } from '../services/lead.service';
import { followUpService } from '../services/followup.service';
import { notificationService } from '../services/notification.service';
import { enqueueAiReply, enqueueNotification } from '../config/queue';
import prisma from '../config/database';
import catchAsync from '../utils/catch-async';

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
            const metadata = body.entry[0].changes[0].value.metadata;
            const message = body.entry[0].changes[0].value.messages[0];

            const businessPhoneNumber = metadata.display_phone_number;
            const customerPhone = message.from; // Sender phone number
            const messageText = message.text.body;
            const timestamp = new Date(parseInt(message.timestamp) * 1000);

            // Find the factory by the WhatsApp number
            const factory = await prisma.factory.findFirst({
                where: {
                    whatsappNumber: businessPhoneNumber,
                },
            });

            if (!factory) {
                console.warn(`Webhook received for unknown business number: ${businessPhoneNumber}`);
                return res.sendStatus(404);
            }

            // Process the message (create/update lead and store message)
            const { lead, isNewLead } = await leadService.processIncomingMessage({
                factoryId: factory.id,
                customerPhone,
                messageText,
                timestamp,
            });

            if (isNewLead) {
                // Determine Sales team numbers for alerts
                const salesUsers = await prisma.user.findMany({
                    where: { factoryId: factory.id, role: { in: ['FACTORY_ADMIN', 'SALES'] } },
                    select: { phone: true }
                });
                const adminPhones = salesUsers.map(u => u.phone).filter(Boolean);

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

                // Queue AI Smart Reply
                await enqueueAiReply({
                    factoryId: factory.id,
                    customerPhone,
                    messageText,
                    context: contextStr
                });

                // Create internal notification
                await notificationService.createNewLeadNotification(factory.id, customerPhone);

                // Schedule follow-up messages
                await followUpService.scheduleFollowUps(lead.id, factory.id);
            } else {
                // Cancel pending follow-ups since customer responded
                await followUpService.cancelPendingFollowUps(lead.id);

                // For existing leads, also queue AI reply to continue conversation (optional based on logic)
                await enqueueAiReply({
                    factoryId: factory.id,
                    customerPhone,
                    messageText,
                    context: 'Customer is continuing conversation. Be helpful.'
                });
            }
        }

        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});
