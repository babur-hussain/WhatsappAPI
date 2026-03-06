import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import { whatsappService } from '../services/whatsapp.service';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';
import prisma from '../config/database';

/**
 * Verify WhatsApp credentials before saving
 */
export const verifyWhatsApp = catchAsync(async (req: AuthRequest, res: Response) => {
    const { phoneNumberId, accessToken } = req.body;

    if (!phoneNumberId || !accessToken) {
        return res.status(400).json(errorResponse('Phone Number ID and Access Token are required'));
    }

    const result = await whatsappService.verifyConnection(phoneNumberId, accessToken);
    res.status(200).json(successResponse(result));
});

import { encrypt } from '../utils/crypto.util';

/**
 * Save WhatsApp credentials and mark factory as connected
 */
export const connectWhatsApp = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized'));

    const { phoneNumberId, accessToken, whatsappNumber, whatsappBusinessAccountId } = req.body;

    if (!phoneNumberId || !accessToken || !whatsappBusinessAccountId) {
        return res.status(400).json(errorResponse('Phone Number ID, Access Token, and Business Account ID are required'));
    }

    // Verify credentials first
    const verification = await whatsappService.verifyConnection(phoneNumberId, accessToken);
    if (!verification.success) {
        return res.status(400).json(errorResponse(verification.error || 'Invalid credentials'));
    }

    await prisma.factory.update({
        where: { id: factoryId },
        data: {
            whatsappPhoneNumberId: phoneNumberId,
            whatsappBusinessAccountId: whatsappBusinessAccountId,
            whatsappAccessToken: encrypt(accessToken),
            whatsappNumber: whatsappNumber || verification.phoneNumber || null,
            isWhatsappConnected: true,
        },
    });

    res.status(200).json(successResponse({
        connected: true,
        phoneNumber: whatsappNumber || verification.phoneNumber,
    }));
});

/**
 * Get WhatsApp connection status
 */
export const getWhatsAppStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized'));

    const factory = await prisma.factory.findUnique({
        where: { id: factoryId },
        select: {
            isWhatsappConnected: true,
            whatsappNumber: true,
            whatsappPhoneNumberId: true,
        },
    });

    if (!factory) return res.status(404).json(errorResponse('Factory not found'));

    res.status(200).json(successResponse({
        connected: factory.isWhatsappConnected,
        phoneNumber: factory.whatsappNumber,
        phoneNumberId: factory.whatsappPhoneNumberId,
    }));
});

/**
 * Disconnect WhatsApp
 */
export const disconnectWhatsApp = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized'));

    await prisma.factory.update({
        where: { id: factoryId },
        data: {
            whatsappPhoneNumberId: null,
            whatsappAccessToken: null,
            whatsappNumber: null,
            isWhatsappConnected: false,
        },
    });

    res.status(200).json(successResponse({ connected: false }));
});
