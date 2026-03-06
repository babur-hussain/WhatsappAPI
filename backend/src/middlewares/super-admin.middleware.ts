import { Response, NextFunction } from 'express';
import { AuthRequest } from './firebase-auth.middleware';
import { errorResponse } from '../api/dto/response.dto';

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json(errorResponse('Access denied. Super Admin role required.', 'FORBIDDEN'));
    }
    next();
};
