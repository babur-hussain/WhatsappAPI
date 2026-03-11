import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import { walletService } from '../services/wallet.service';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';

/**
 * GET /wallet — Get wallet balance
 */
export const getWallet = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const wallet = await walletService.getOrCreateWallet(factoryId);
    res.status(200).json(successResponse(wallet));
});

/**
 * POST /wallet/recharge — Create a Razorpay order for wallet recharge
 */
export const createRechargeOrder = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { amount } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json(errorResponse('Valid amount is required', 'VALIDATION_ERROR'));
    }

    const order = await walletService.createRechargeOrder(factoryId, amount);
    res.status(200).json(successResponse(order));
});

/**
 * POST /wallet/verify-recharge — Verify Razorpay payment & credit wallet
 */
export const verifyRecharge = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
        return res.status(400).json(errorResponse('Missing payment verification fields', 'VALIDATION_ERROR'));
    }

    const result = await walletService.verifyAndCreditRecharge(
        factoryId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount
    );

    res.status(200).json(successResponse(result));
});

/**
 * GET /wallet/transactions — Paginated transaction history
 */
export const getTransactions = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const data = await walletService.getTransactions(factoryId, page, limit);
    res.status(200).json(successResponse(data));
});
