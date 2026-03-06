import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import prisma from '../config/database';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';
import { v4 as uuidv4 } from 'uuid';

export const getApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const factory = await prisma.factory.findUnique({
        where: { id: factoryId },
        select: { apiKey: true, webhookUrl: true, webhookSecret: true }
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
