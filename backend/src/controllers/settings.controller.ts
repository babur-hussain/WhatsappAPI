import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import prisma from '../config/database';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { whatsappService } from '../services/whatsapp.service';

export const getApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const factory = await prisma.factory.findUnique({
        where: { id: factoryId },
        select: { apiKey: true, apiSecret: true, webhookUrl: true, webhookSecret: true }
    });

    if (!factory) return res.status(404).json(errorResponse('Factory not found'));

    res.status(200).json(successResponse(factory));
});

export const regenerateApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const newApiKey = uuidv4();

    const factory = await prisma.factory.update({
        where: { id: factoryId },
        data: { apiKey: newApiKey },
        select: { apiKey: true }
    });

    res.status(200).json(successResponse(factory));
});

export const regenerateApiSecret = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const newApiSecret = crypto.randomBytes(32).toString('hex');

    const factory = await prisma.factory.update({
        where: { id: factoryId },
        data: { apiSecret: newApiSecret },
        select: { apiSecret: true }
    });

    res.status(200).json(successResponse(factory));
});

export const updateWebhookConfig = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { webhookUrl, webhookSecret } = req.body;

    const factory = await prisma.factory.update({
        where: { id: factoryId },
        data: { webhookUrl, webhookSecret },
        select: { webhookUrl: true, webhookSecret: true }
    });

    res.status(200).json(successResponse(factory));
});

export const getAutoReplySettings = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const factory = await prisma.factory.findUnique({
        where: { id: factoryId },
        select: {
            autoReplyEnabled: true,
            autoReplyType: true,
            autoReplyStaticMessage: true,
            autoReplyAiPrompt: true,
            autoReplyAiModel: true,
        }
    });

    if (!factory) return res.status(404).json(errorResponse('Factory not found'));

    res.status(200).json(successResponse(factory));
});

export const updateAutoReplySettings = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { autoReplyEnabled, autoReplyType, autoReplyStaticMessage, autoReplyAiPrompt, autoReplyAiModel } = req.body;

    const data: any = {};
    if (autoReplyEnabled !== undefined) data.autoReplyEnabled = autoReplyEnabled;
    if (autoReplyType) data.autoReplyType = autoReplyType;
    if (autoReplyStaticMessage !== undefined) data.autoReplyStaticMessage = autoReplyStaticMessage;
    if (autoReplyAiPrompt !== undefined) data.autoReplyAiPrompt = autoReplyAiPrompt;
    if (autoReplyAiModel) data.autoReplyAiModel = autoReplyAiModel;

    const factory = await prisma.factory.update({
        where: { id: factoryId },
        data,
        select: {
            autoReplyEnabled: true,
            autoReplyType: true,
            autoReplyStaticMessage: true,
            autoReplyAiPrompt: true,
            autoReplyAiModel: true,
        }
    });

    res.status(200).json(successResponse(factory));
});

export const getWhatsappProfile = catchAsync(async (req: any, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized'));

    const profileResponse = await whatsappService.getBusinessProfile(factoryId);
    
    // The response is usually { data: [ { about: '...', address: '...', ... } ] }
    const profile = profileResponse.data?.[0] || {};
    
    return res.status(200).json(successResponse({ profile }));
});

export const updateWhatsappProfile = catchAsync(async (req: any, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized'));

    const { about, address, description, email, websites, vertical } = req.body;
    
    const dataToUpdate: any = {};
    if (about !== undefined) dataToUpdate.about = about;
    if (address !== undefined) dataToUpdate.address = address;
    if (description !== undefined) dataToUpdate.description = description;
    if (email !== undefined) dataToUpdate.email = email;
    if (websites !== undefined) dataToUpdate.websites = Array.isArray(websites) ? websites : [websites];
    if (vertical !== undefined) dataToUpdate.vertical = vertical;

    await whatsappService.updateBusinessProfile(factoryId, dataToUpdate);
    
    return res.status(200).json(successResponse(null));
});
