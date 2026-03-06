import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import { followUpService } from '../services/followup.service';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';

export const getFollowUpSettings = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const settings = await followUpService.getSettings(factoryId);
    res.status(200).json(successResponse(settings));
});

export const updateFollowUpSettings = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { followUpsEnabled, followUps } = req.body;
    const settings = await followUpService.updateSettings(factoryId, { followUpsEnabled, followUps });
    res.status(200).json(successResponse(settings));
});
