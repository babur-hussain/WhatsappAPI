import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import prisma from '../config/database';
import { errorResponse } from '../api/dto/response.dto';
import { cacheGet, cacheSet } from '../config/redis';

export interface AuthRequest extends Request {
    user?: any;
    firebaseToken?: any;
}

export const verifyFirebaseToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json(errorResponse('No token provided', 'UNAUTHORIZED'));
        }

        const decodedToken = await auth.verifyIdToken(token);
        req.firebaseToken = decodedToken;
        next();
    } catch (e: any) {
        console.error('Firebase Auth error:', e.message);
        return res.status(401).json(errorResponse('Invalid Firebase token', 'UNAUTHORIZED'));
    }
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) return res.status(401).json(errorResponse('Not authorized', 'UNAUTHORIZED'));

        const decodedToken = await auth.verifyIdToken(token);
        const cacheKey = `auth:user:${decodedToken.uid}`;

        // 1. Attempt Cache Hit
        let user = await cacheGet<any>(cacheKey);

        // 2. Cache Miss: Query Database & Set Cache
        if (!user) {
            user = await prisma.user.findUnique({
                where: { firebaseUid: decodedToken.uid },
                include: { factory: true }
            });

            if (user) {
                await cacheSet(cacheKey, user, 300); // 5 min TTL
            }
        }

        if (!user) {
            return res.status(401).json(errorResponse('User not found. Please sync.', 'UNAUTHORIZED'));
        }

        if (user.role !== 'SUPER_ADMIN') {
            if (!user.factory) {
                return res.status(401).json(errorResponse('Factory not found for user.', 'UNAUTHORIZED'));
            }
            if (!user.factory.isActive) {
                return res.status(403).json(errorResponse('Your factory account is currently inactive. Please contact support.', 'FORBIDDEN'));
            }
        }

        req.user = user;
        next();
    } catch (e: any) {
        return res.status(401).json(errorResponse('Not authorized', 'UNAUTHORIZED'));
    }
};
