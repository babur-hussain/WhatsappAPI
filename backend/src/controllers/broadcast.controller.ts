import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import { broadcastService } from '../services/broadcast.service';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';

export const createBroadcast = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { title, message, mediaUrl, targetType } = req.body;

    if (!title || !message || !targetType) {
        return res.status(400).json(errorResponse('Missing required fields'));
    }

    try {
        const broadcast = await broadcastService.createBroadcast(factoryId, { title, message, mediaUrl, targetType });
        res.status(201).json(successResponse(broadcast));
    } catch (error) {
        res.status(400).json(errorResponse((error as Error).message));
    }
});

export const getBroadcasts = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const broadcasts = await broadcastService.getBroadcasts(factoryId);
    res.status(200).json(successResponse(broadcasts));
});

export const getBroadcastDetails = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    try {
        const details = await broadcastService.getBroadcastDetails(factoryId, id, page, limit);
        res.status(200).json(successResponse(details));
    } catch (error) {
        res.status(404).json(errorResponse((error as Error).message));
    }
});
