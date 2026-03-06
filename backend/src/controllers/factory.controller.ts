import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import prisma from '../config/database';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';

export const connectWhatsapp = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const { whatsappNumber, whatsappPhoneNumberId } = req.body;

    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    if (!whatsappNumber || !whatsappPhoneNumberId) {
        return res.status(400).json(errorResponse('Whatsapp number and phone number ID are required', 'VALIDATION_ERROR'));
    }

    const factory = await prisma.factory.update({
        where: { id: factoryId },
        data: {
            whatsappNumber,
            whatsappPhoneNumberId,
            isWhatsappConnected: true
        }
    });

    res.status(200).json(successResponse(factory));
});

export const completeOnboarding = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;

    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const factory = await prisma.factory.update({
        where: { id: factoryId },
        data: {
            isOnboardingComplete: true
        }
    });

    res.status(200).json(successResponse(factory));
});
