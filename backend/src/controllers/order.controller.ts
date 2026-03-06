import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import { orderService } from '../services/order.service';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';
import { OrderStatus } from '@prisma/client';

export const createOrderFromLead = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const { leadId } = req.params;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { productName, quantity, unitPrice, notes } = req.body;

    if (!productName || !quantity || !unitPrice) {
        return res.status(400).json(errorResponse('Missing required fields'));
    }

    try {
        const order = await orderService.createOrderFromLead(factoryId, leadId, {
            productName,
            quantity: Number(quantity),
            unitPrice: Number(unitPrice),
            notes
        });
        res.status(201).json(successResponse(order));
    } catch (error) {
        res.status(400).json(errorResponse((error as Error).message));
    }
});

export const getOrders = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const filters = {
        orderStatus: req.query.orderStatus as OrderStatus | undefined,
        customerPhone: req.query.customerPhone as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
    };

    const orders = await orderService.getOrders(factoryId, filters, page, limit);
    res.status(200).json(successResponse(orders));
});

export const getOrderDetails = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const { id } = req.params;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const order = await orderService.getOrderDetails(factoryId, id);
    if (!order) return res.status(404).json(errorResponse('Order not found'));

    res.status(200).json(successResponse(order));
});

export const updateOrderStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    if (!Object.values(OrderStatus).includes(orderStatus)) {
        return res.status(400).json(errorResponse('Invalid order status'));
    }

    try {
        const order = await orderService.updateOrderStatus(factoryId, id, orderStatus);
        res.status(200).json(successResponse(order));
    } catch (error) {
        res.status(404).json(errorResponse((error as Error).message));
    }
});

export const getRevenueAnalytics = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const analytics = await orderService.getRevenueAnalytics(factoryId);
    res.status(200).json(successResponse(analytics));
});
