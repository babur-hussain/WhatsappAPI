import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { successResponse, errorResponse } from '../dto/response.dto';
import catchAsync from '../../utils/catch-async';
import { AuthRequest } from '../../middlewares/firebase-auth.middleware';

export const sync = catchAsync(async (req: AuthRequest, res: Response) => {
    const firebaseToken = req.firebaseToken;

    if (!firebaseToken) {
        return res.status(401).json(errorResponse('Missing Firebase Token Context', 'UNAUTHORIZED'));
    }

    try {
        const data = await authService.syncUser(firebaseToken, req.body);
        res.status(200).json(successResponse(data));
    } catch (e: any) {
        console.log('Auth sync error for:', firebaseToken.email, e.message);
        res.status(400).json(errorResponse(e.message, 'BAD_REQUEST'));
    }
});

export const me = catchAsync(async (req: AuthRequest, res: Response) => {
    const firebaseToken = req.firebaseToken;

    if (!firebaseToken) {
        return res.status(401).json(errorResponse('Missing Firebase Token Context', 'UNAUTHORIZED'));
    }

    try {
        const data = await authService.getMe(firebaseToken);
        res.status(200).json(successResponse(data));
    } catch (e: any) {
        res.status(404).json(errorResponse(e.message, 'NOT_FOUND'));
    }
});
