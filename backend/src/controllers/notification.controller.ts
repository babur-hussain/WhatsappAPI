import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import prisma from '../config/database';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';

export const getNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const notifications = await prisma.notification.findMany({
        where: { factoryId, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    res.status(200).json(successResponse(notifications));
});

export const markNotificationRead = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const id = req.params.id;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const notification = await prisma.notification.updateMany({
        where: { id, factoryId },
        data: { isRead: true }
    });

    res.status(200).json(successResponse({ success: true }));
});
