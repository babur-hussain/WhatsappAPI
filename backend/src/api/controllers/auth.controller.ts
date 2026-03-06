import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { successResponse, errorResponse } from '../dto/response.dto';
import catchAsync from '../../utils/catch-async';
import { AuthRequest } from '../../middlewares/firebase-auth.middleware';

export const sync = catchAsync(async (req: AuthRequest, res: Response) => {
    const firebaseToken = req.firebaseToken;

    console.log('=== AUTH SYNC DEBUG ===');
    console.log('firebaseToken present:', !!firebaseToken);
    console.log('firebaseToken uid:', firebaseToken?.uid);
    console.log('firebaseToken email:', firebaseToken?.email);
    console.log('req.body:', JSON.stringify(req.body));

    if (!firebaseToken) {
        return res.status(401).json(errorResponse('Missing Firebase Token Context', 'UNAUTHORIZED'));
    }

    try {
        const data = await authService.syncUser(firebaseToken, req.body);
        console.log('Auth sync SUCCESS for:', firebaseToken.email);
        res.status(200).json(successResponse(data));
    } catch (e: any) {
        console.error('=== AUTH SYNC ERROR ===');
        console.error('Error message:', e.message);
        console.error('Error stack:', e.stack);
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
