import prisma from '../config/database';
import { LeadStatus, LeadSource, SenderType, LeadActivityType } from '@prisma/client';

export class LeadService {
    /**
     * Process an incoming WhatsApp message: find or create lead, and save message.
     * Also tracks first customer message time and records LeadActivity.
     */
    public async processIncomingMessage(params: {
        factoryId: string;
        customerPhone: string;
        customerName?: string;
        messageText: string;
        timestamp: Date;
    }) {
        const { factoryId, customerPhone, customerName, messageText, timestamp } = params;

        return await prisma.$transaction(async (tx: any) => {
            // Find or create the Lead
            let lead = await tx.lead.findUnique({
                where: {
                    factoryId_customerPhone: {
                        factoryId,
                        customerPhone,
                    },
                },
            });

            const isNewLead = !lead;

            if (!lead) {
                // Create new lead
                lead = await tx.lead.create({
                    data: {
                        factoryId,
                        customerPhone,
                        customerName,
                        lastMessage: messageText,
                        status: LeadStatus.NEW,
                        source: LeadSource.WHATSAPP,
                        firstCustomerMessageAt: timestamp,
                    },
                });

                // Record LEAD_CREATED activity
                await tx.leadActivity.create({
                    data: {
                        leadId: lead.id,
                        factoryId,
                        type: LeadActivityType.LEAD_CREATED,
                        metadata: { customerPhone, customerName, source: 'WHATSAPP' },
                    },
                });
            } else {
                // Update existing lead; set firstCustomerMessageAt if not already set
                const updateData: any = {
                    lastMessage: messageText,
                    updatedAt: new Date(),
                };
                if (!lead.firstCustomerMessageAt) {
                    updateData.firstCustomerMessageAt = timestamp;
                }

                lead = await tx.lead.update({
                    where: { id: lead.id },
                    data: updateData,
                });
            }

            // Store the message
            const message = await tx.message.create({
                data: {
                    leadId: lead.id,
                    factoryId,
                    content: messageText,
                    sender: SenderType.CUSTOMER,
                    timestamp,
                },
            });

            // Record MESSAGE_RECEIVED activity
            await tx.leadActivity.create({
                data: {
                    leadId: lead.id,
                    factoryId,
                    type: LeadActivityType.MESSAGE_RECEIVED,
                    metadata: { messageId: message.id, preview: messageText.substring(0, 100) },
                },
            });

            return { lead, message, isNewLead };
        });
    }

    /**
     * Record admin/sales reply and calculate response time if first reply
     */
    public async processOutgoingMessage(params: {
        leadId: string;
        factoryId: string;
        content: string;
        sender: SenderType;
        timestamp: Date;
    }) {
        const { leadId, factoryId, content, sender, timestamp } = params;

        return await prisma.$transaction(async (tx: any) => {
            const lead = await tx.lead.findUnique({ where: { id: leadId } });
            if (!lead) throw new Error('Lead not found');

            // Store the message
            const message = await tx.message.create({
                data: {
                    leadId,
                    factoryId,
                    content,
                    sender,
                    timestamp,
                },
            });

            // Calculate response time if first admin/sales reply
            if (
                (sender === SenderType.ADMIN || sender === SenderType.BOT) &&
                !lead.firstResponseAt &&
                lead.firstCustomerMessageAt
            ) {
                const responseTimeSeconds = Math.round(
                    (timestamp.getTime() - lead.firstCustomerMessageAt.getTime()) / 1000
                );

                await tx.lead.update({
                    where: { id: leadId },
                    data: {
                        firstResponseAt: timestamp,
                        responseTimeSeconds,
                        lastMessage: content,
                    },
                });
            } else {
                await tx.lead.update({
                    where: { id: leadId },
                    data: { lastMessage: content },
                });
            }

            // Record MESSAGE_SENT activity
            await tx.leadActivity.create({
                data: {
                    leadId,
                    factoryId,
                    type: LeadActivityType.MESSAGE_SENT,
                    metadata: { messageId: message.id, sender, preview: content.substring(0, 100) },
                },
            });

            return message;
        });
    }

    /**
     * Update lead status with conversion tracking
     */
    public async updateLeadStatus(factoryId: string, leadId: string, newStatus: LeadStatus) {
        const lead = await prisma.lead.findFirst({ where: { id: leadId, factoryId } });
        if (!lead) throw new Error('Lead not found');

        const oldStatus = lead.status;

        const updateData: any = { status: newStatus };

        // Set closedAt when lead becomes CLOSED
        if (newStatus === LeadStatus.CLOSED && oldStatus !== LeadStatus.CLOSED) {
            updateData.closedAt = new Date();
        }

        // Clear closedAt if reopening
        if (newStatus !== LeadStatus.CLOSED && oldStatus === LeadStatus.CLOSED) {
            updateData.closedAt = null;
        }

        const updated = await prisma.lead.update({
            where: { id: leadId },
            data: updateData,
        });

        // Record STATUS_CHANGED activity
        await prisma.leadActivity.create({
            data: {
                leadId,
                factoryId,
                type: LeadActivityType.STATUS_CHANGED,
                metadata: { from: oldStatus, to: newStatus },
            },
        });

        return updated;
    }

    /**
     * Get paginated leads for a factory
     */
    public async getLeads(factoryId: string, page: number, limit: number, search?: string, status?: LeadStatus) {
        const skip = (page - 1) * limit;

        const where: any = { factoryId };

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { customerPhone: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.lead.count({ where }),
        ]);

        return { leads, total, page, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Get a single lead with its messages
     */
    public async getLeadById(factoryId: string, id: string) {
        return await prisma.lead.findFirst({
            where: { id, factoryId },
            include: {
                messages: {
                    orderBy: { timestamp: 'asc' },
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });
    }

    /**
     * Update a lead
     */
    public async updateLead(factoryId: string, id: string, data: any) {
        // Verify lead belongs to factory first
        const lead = await prisma.lead.findFirst({ where: { id, factoryId } });
        if (!lead) throw new Error('Lead not found');

        return await prisma.lead.update({
            where: { id },
            data,
        });
    }

    /**
     * Get lead statistics for dashboard
     */
    public async getStats(factoryId: string) {
        const [total, newLeads, contacted, closed] = await Promise.all([
            prisma.lead.count({ where: { factoryId } }),
            prisma.lead.count({ where: { factoryId, status: LeadStatus.NEW } }),
            prisma.lead.count({ where: { factoryId, status: LeadStatus.CONTACTED } }),
            prisma.lead.count({ where: { factoryId, status: LeadStatus.CLOSED } }),
        ]);

        return { total, newLeads, contacted, closed };
    }
}

export const leadService = new LeadService();
