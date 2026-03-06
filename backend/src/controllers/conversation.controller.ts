import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';
import prisma from '../config/database';
import { aiService } from '../services/ai.service';
import { leadService } from '../services/lead.service';
import { whatsappService } from '../services/whatsapp.service';
import { SenderType } from '@prisma/client';

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

    const conversations = leads.map((lead) => ({
        id: lead.id,
        customerPhone: lead.customerPhone,
        customerName: lead.customerName,
        status: lead.status,
        lastMessage: lead.messages[0]?.content || '',
        lastMessageSender: lead.messages[0]?.sender || null,
        lastMessageTime: lead.messages[0]?.timestamp || lead.updatedAt,
        messageCount: lead._count.messages,
    }));

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

    res.status(200).json(successResponse({
        lead: {
            id: lead.id,
            customerPhone: lead.customerPhone,
            customerName: lead.customerName,
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
