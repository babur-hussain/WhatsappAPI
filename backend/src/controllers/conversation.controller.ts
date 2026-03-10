import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';
import prisma from '../config/database';
import { aiService } from '../services/ai.service';
import { leadService } from '../services/lead.service';
import { whatsappService } from '../services/whatsapp.service';
import { SenderType } from '@prisma/client';
import { hashPhone, decrypt } from '../utils/crypto.util';

/**
 * Get all conversations (leads with messages) for a factory
 */
export const getConversations = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized'));

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {
        factoryId,
        messages: { some: {} }, // Only leads that have messages
    };

    if (search) {
        where.OR = [
            { customerPhone: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [leads, total] = await Promise.all([
        prisma.lead.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            skip,
            take: limit,
            include: {
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 1, // Last message only for preview
                },
                _count: {
                    select: { messages: true },
                },
            },
        }),
        prisma.lead.count({ where }),
    ]);

    // Look up contact names for leads that don't have a customerName
    const leadsWithoutName = leads.filter((l: any) => !l.customerName);
    const contactNameMap = new Map<string, string>(); // maps leadId -> contact name

    if (leadsWithoutName.length > 0) {
        // Generate all possible phone hash variants for each lead
        // e.g. "+91 62641 34364" -> try hashes for "916264134364", "6264134364", etc.
        const allHashes: string[] = [];
        const hashToLeadId = new Map<string, string>();

        for (const lead of leadsWithoutName) {
            const digits = (lead as any).customerPhone.replace(/\D/g, '');
            const variants = [digits]; // full digits
            // Strip common country code prefixes (91 for India, 1 for US, etc.)
            if (digits.length > 10) {
                variants.push(digits.slice(-10)); // last 10 digits
            }
            if (digits.startsWith('91') && digits.length > 10) {
                variants.push(digits.slice(2)); // strip 91
            }
            if (digits.startsWith('1') && digits.length === 11) {
                variants.push(digits.slice(1)); // strip 1
            }

            for (const v of variants) {
                const h = hashPhone(v);
                allHashes.push(h);
                hashToLeadId.set(h, (lead as any).id);
            }
        }

        const contacts = await prisma.contact.findMany({
            where: {
                factoryId,
                phoneHash: { in: allHashes },
                name: { not: null },
            },
            select: { phoneHash: true, name: true },
        });
        contacts.forEach((c: any) => {
            if (c.name) {
                const leadId = hashToLeadId.get(c.phoneHash);
                if (leadId) contactNameMap.set(leadId, c.name);
            }
        });
    }

    const conversations = leads.map((lead: any) => {
        const displayName = lead.customerName || contactNameMap.get(lead.id) || null;
        return {
            id: lead.id,
            customerPhone: lead.customerPhone,
            customerName: displayName,
            profilePicture: lead.profilePicture,
            status: lead.status,
            lastMessage: lead.messages[0]?.content || '',
            lastMessageSender: lead.messages[0]?.sender || null,
            lastMessageTime: lead.messages[0]?.timestamp || lead.updatedAt,
            messageCount: lead._count.messages,
            unreadCount: lead.unreadCount || 0,
        };
    });

    res.status(200).json(successResponse({
        conversations,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }));
});

/**
 * Get full message history for a conversation
 */
export const getMessages = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized'));

    const leadId = req.params.leadId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const lead = await prisma.lead.findFirst({
        where: { id: leadId, factoryId },
    });

    if (!lead) return res.status(404).json(errorResponse('Conversation not found'));

    const [messages, total] = await Promise.all([
        prisma.message.findMany({
            where: { leadId },
            orderBy: { timestamp: 'asc' },
            skip,
            take: limit,
        }),
        prisma.message.count({ where: { leadId } }),
    ]);

    // Reset unread count when messages are fetched
    if ((lead as any).unreadCount > 0) {
        await prisma.lead.update({
            where: { id: leadId },
            data: { unreadCount: 0 } as any
        });
    }

    res.status(200).json(successResponse({
        lead: {
            id: lead.id,
            customerPhone: lead.customerPhone,
            customerName: lead.customerName,
            profilePicture: lead.profilePicture,
            status: lead.status,
            productInterest: lead.productInterest,
            createdAt: lead.createdAt,
        },
        messages,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }));
});

/**
 * Send a manual reply from the dashboard
 */
export const sendReply = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized'));

    const leadId = req.params.leadId;
    const { message } = req.body;

    if (!message) return res.status(400).json(errorResponse('Message is required'));

    const lead = await prisma.lead.findFirst({ where: { id: leadId, factoryId } });
    if (!lead) return res.status(404).json(errorResponse('Conversation not found'));

    // Send via WhatsApp
    await whatsappService.sendTextMessage(factoryId, lead.customerPhone, message);

    // Store in conversation history
    const stored = await leadService.processOutgoingMessage({
        leadId,
        factoryId,
        content: message,
        sender: SenderType.ADMIN,
        timestamp: new Date(),
    });

    res.status(200).json(successResponse(stored));
});

/**
 * Get AI-suggested reply for a conversation
 */
export const getSuggestedReply = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized'));

    const leadId = req.params.leadId;

    const lead = await prisma.lead.findFirst({ where: { id: leadId, factoryId } });
    if (!lead) return res.status(404).json(errorResponse('Conversation not found'));

    const analysis = await aiService.generateSuggestedReply(factoryId, leadId);

    res.status(200).json(successResponse(analysis));
});

/**
 * Manually mark a conversation as read
 */
export const markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized'));

    const leadId = req.params.leadId;

    const lead = await prisma.lead.findFirst({ where: { id: leadId, factoryId } });
    if (!lead) return res.status(404).json(errorResponse('Conversation not found'));

    if ((lead as any).unreadCount > 0) {
        await prisma.lead.update({
            where: { id: leadId },
            data: { unreadCount: 0 } as any
        });
    }

    res.status(200).json(successResponse({ unreadCount: 0 }));
});
