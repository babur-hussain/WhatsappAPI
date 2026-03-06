import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import { analyticsService } from '../services/analytics.service';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';

/**
 * Resolve factoryId: SUPER_ADMIN sees global, factory users see own data only.
 */
function resolveFactoryId(req: AuthRequest): string | null {
    if (req.user?.role === 'SUPER_ADMIN') {
        // Allow optional factoryId filter for super admin
        return (req.query.factoryId as string) || null;
    }
    return req.user?.factoryId || null;
}

export const getDashboard = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = resolveFactoryId(req);
    if (!factoryId && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    }

    const data = await analyticsService.getDashboard(factoryId);
    res.status(200).json(successResponse(data));
});

export const getLeadsOverTime = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = resolveFactoryId(req);
    if (!factoryId && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    }

    const data = await analyticsService.getLeadsOverTime(factoryId);
    res.status(200).json(successResponse(data));
});

export const getTopProducts = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = resolveFactoryId(req);
    if (!factoryId && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    }

    const data = await analyticsService.getTopProducts(factoryId);
    res.status(200).json(successResponse(data));
});

export const getSalesPerformance = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = resolveFactoryId(req);
    if (!factoryId && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    }

    const data = await analyticsService.getSalesPerformance(factoryId);
    res.status(200).json(successResponse(data));
});
