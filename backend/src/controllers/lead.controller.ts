import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import { leadService } from '../services/lead.service';
import catchAsync from '../utils/catch-async';
import { LeadStatus } from '@prisma/client';
import { successResponse, errorResponse } from '../api/dto/response.dto';

export const getLeads = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const status = req.query.status as LeadStatus | undefined;

    const result = await leadService.getLeads(factoryId, page, limit, search, status);
    res.status(200).json(successResponse(result));
});

export const getLead = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const id = req.params.id;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const lead = await leadService.getLeadById(factoryId, id);
    if (!lead) return res.status(404).json(errorResponse('Lead not found', 'NOT_FOUND'));

    res.status(200).json(successResponse(lead));
});

export const updateLeadStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const id = req.params.id;
    const { status } = req.body;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const lead = await leadService.updateLeadStatus(factoryId, id, status);
    res.status(200).json(successResponse(lead));
});

export const updateLeadDetails = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const id = req.params.id;
    const { customerName, productInterest, quantity } = req.body;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const lead = await leadService.updateLead(factoryId, id, {
        customerName,
        productInterest,
        quantity: quantity ? parseInt(quantity) : null
    });

    res.status(200).json(successResponse(lead));
});

export const getLeadStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const stats = await leadService.getStats(factoryId);
    res.status(200).json(successResponse(stats));
});
