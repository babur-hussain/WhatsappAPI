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
import { LeadStatus, LeadSource } from '@prisma/client';

/**
 * Get all conversations (leads with messages) for a factory
 */
export const getConversations = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    
    if (!factoryId && !isSuperAdmin) return res.status(401).json(errorResponse('Unauthorized'));

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {
        messages: { some: {} }, // Only leads that have messages
    };
    
    if (factoryId) {
        where.factoryId = factoryId;
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

        const contactWhere: any = {
            phoneHash: { in: allHashes },
            name: { not: null },
        };
        if (factoryId) contactWhere.factoryId = factoryId;

        const contacts = await prisma.contact.findMany({
            where: contactWhere,
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
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (!factoryId && !isSuperAdmin) return res.status(401).json(errorResponse('Unauthorized'));

    const leadId = req.params.leadId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const leadWhere: any = { id: leadId };
    if (factoryId) leadWhere.factoryId = factoryId;

    const lead = await prisma.lead.findFirst({
        where: leadWhere,
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

    let displayName = lead.customerName;

    // If no name, try to look up from contacts using phone hash variants
    if (!displayName) {
        const digits = (lead as any).customerPhone.replace(/\D/g, '');
        const variants = [digits];
        if (digits.length > 10) variants.push(digits.slice(-10));
        if (digits.startsWith('91') && digits.length > 10) variants.push(digits.slice(2));
        if (digits.startsWith('1') && digits.length === 11) variants.push(digits.slice(1));

        const allHashes = variants.map(v => hashPhone(v));
        
        const contactWhere: any = {
            phoneHash: { in: allHashes },
            name: { not: null },
        };
        if (factoryId) contactWhere.factoryId = factoryId;

        const contact = await prisma.contact.findFirst({
            where: contactWhere,
            select: { name: true },
        });
        
        if (contact?.name) {
            displayName = contact.name;
        }
    }

    res.status(200).json(successResponse({
        lead: {
            id: lead.id,
            customerPhone: lead.customerPhone,
            customerName: displayName,
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
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (!factoryId && !isSuperAdmin) return res.status(401).json(errorResponse('Unauthorized'));

    const leadId = req.params.leadId;
    const { message, mediaUrl, mediaType } = req.body;

    if (!message && !mediaUrl) {
        return res.status(400).json(errorResponse('Message or media is required'));
    }

    const leadWhere: any = { id: leadId };
    if (factoryId) leadWhere.factoryId = factoryId;

    const lead = await prisma.lead.findFirst({ where: leadWhere });
    if (!lead) return res.status(404).json(errorResponse('Conversation not found'));

    // Send via WhatsApp - wrap in try/catch so message is still stored even if WA fails
    let whatsappMessageId: string | undefined;
    let sendError: string | null = null;
    let content = message || '';

    try {
        if (mediaUrl && mediaType) {
            const sendResult = await whatsappService.sendMediaMessage(lead.factoryId, lead.customerPhone, mediaUrl, mediaType, message);
            whatsappMessageId = sendResult?.messages?.[0]?.id || undefined;
            content = message ? `[Media: ${mediaType}] ${mediaUrl}\n${message}` : `[Media: ${mediaType}] ${mediaUrl}`;
        } else {
            const sendResult = await whatsappService.sendTextMessage(lead.factoryId, lead.customerPhone, message);
            whatsappMessageId = sendResult?.messages?.[0]?.id || undefined;
        }
    } catch (err: any) {
        console.error('WhatsApp send failed:', err.message);
        sendError = err.message;
        // Don't throw - still store the message locally
    }

    // Store in conversation history
    const stored = await leadService.processOutgoingMessage({
        leadId,
        factoryId: lead.factoryId,
        content,
        sender: SenderType.ADMIN,
        timestamp: new Date(),
        whatsappMessageId,
    });

    if (sendError) {
        // Message stored but WhatsApp delivery failed
        return res.status(200).json(successResponse({ ...stored, sendError }));
    }

    res.status(200).json(successResponse(stored));
});

/**
 * Get AI-suggested reply for a conversation
 */
export const getSuggestedReply = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (!factoryId && !isSuperAdmin) return res.status(401).json(errorResponse('Unauthorized'));

    const leadId = req.params.leadId;

    const leadWhere: any = { id: leadId };
    if (factoryId) leadWhere.factoryId = factoryId;

    const lead = await prisma.lead.findFirst({ where: leadWhere });
    if (!lead) return res.status(404).json(errorResponse('Conversation not found'));

    const analysis = await aiService.generateSuggestedReply(lead.factoryId, leadId);

    res.status(200).json(successResponse(analysis));
});

/**
 * Manually mark a conversation as read
 */
export const markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (!factoryId && !isSuperAdmin) return res.status(401).json(errorResponse('Unauthorized'));

    const leadId = req.params.leadId;

    const leadWhere: any = { id: leadId };
    if (factoryId) leadWhere.factoryId = factoryId;

    const lead = await prisma.lead.findFirst({ where: leadWhere });
    if (!lead) return res.status(404).json(errorResponse('Conversation not found'));

    if ((lead as any).unreadCount > 0) {
        await prisma.lead.update({
            where: { id: leadId },
            data: { unreadCount: 0 } as any
        });
    }

    res.status(200).json(successResponse({ unreadCount: 0 }));
});

/**
 * Initiate a new conversation with a contact (resolves phone number to leadId)
 */
export const initiateConversation = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (!factoryId && !isSuperAdmin) return res.status(401).json(errorResponse('Unauthorized'));
    const effectiveFactoryId = factoryId!; // Must have a factory context

    let { customerPhone, customerName } = req.body;

    if (!customerPhone) return res.status(400).json(errorResponse('customerPhone is required'));

    // Clean phone number (strip non-digits)
    customerPhone = customerPhone.replace(/\D/g, '');
    
    // Default to +91 if no country code and length is 10
    if (customerPhone.length === 10) {
        customerPhone = '91' + customerPhone;
    }

    // Check if lead already exists
    let lead = await prisma.lead.findFirst({
        where: {
            factoryId: effectiveFactoryId,
            customerPhone: customerPhone,
        }
    });

    if (!lead) {
        // Create new lead
        lead = await prisma.lead.create({
            data: {
                factoryId: effectiveFactoryId,
                customerPhone,
                customerName: customerName || null,
                status: LeadStatus.NEW,
                source: LeadSource.WHATSAPP,
                unreadCount: 0
            }
        });
    } else if (customerName && !lead.customerName) {
        // Update name if we have one and lead doesn't
        lead = await prisma.lead.update({
            where: { id: lead.id },
            data: { customerName }
        });
    }

    res.status(200).json(successResponse({ leadId: lead.id }));
});
