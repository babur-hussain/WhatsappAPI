import { Response, NextFunction } from 'express';
import { AuthRequest } from './firebase-auth.middleware';
import prisma from '../config/database';
import { errorResponse } from '../api/dto/response.dto';
import { SubscriptionStatus } from '@prisma/client';

export const requireActiveSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const factoryId = req.user?.factoryId;

    if (!factoryId) {
        return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    }

    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                factoryId,
                status: SubscriptionStatus.ACTIVE,
            }
        });

        if (!subscription) {
            return res.status(403).json(errorResponse('Active subscription required to access this resource', 'PAYMENT_REQUIRED'));
        }

        next();
    } catch (error) {
        return res.status(500).json(errorResponse('Failed to verify subscription status', 'INTERNAL_ERROR'));
    }
};
