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
import crypto from 'crypto';

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

    // Generate a unique verify token for this factory's webhook
    const verifyToken = `lf_${crypto.randomBytes(16).toString('hex')}`;

    await prisma.factory.update({
        where: { id: factoryId },
        data: {
            whatsappPhoneNumberId: phoneNumberId,
            whatsappBusinessAccountId: whatsappBusinessAccountId,
            whatsappAccessToken: encrypt(accessToken),
            whatsappNumber: whatsappNumber || verification.phoneNumber || null,
            whatsappVerifyToken: verifyToken,
            isWhatsappConnected: true,
        },
    });

    res.status(200).json(successResponse({
        connected: true,
        phoneNumber: whatsappNumber || verification.phoneNumber,
        verifyToken,
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
            whatsappBusinessAccountId: true,
            whatsappVerifyToken: true,
        },
    });

    if (!factory) return res.status(404).json(errorResponse('Factory not found'));

    res.status(200).json(successResponse({
        connected: factory.isWhatsappConnected,
        phoneNumber: factory.whatsappNumber,
        phoneNumberId: factory.whatsappPhoneNumberId,
        businessAccountId: factory.whatsappBusinessAccountId,
        verifyToken: factory.whatsappVerifyToken,
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
            whatsappBusinessAccountId: null,
            whatsappVerifyToken: null,
            isWhatsappConnected: false,
        },
    });

    res.status(200).json(successResponse({ connected: false }));
});
