import prisma from '../config/database';
import { OrderStatus, OrderSource, LeadStatus } from '@prisma/client';
import { logger } from '../config/logger';

export class OrderService {
    /**
     * Dashboard: Create order from an existing lead
     */
    public async createOrderFromLead(
        factoryId: string,
        leadId: string,
        data: { productName: string; quantity: number; unitPrice: number; notes?: string }
    ) {
        const lead = await prisma.lead.findFirst({
            where: { id: leadId, factoryId },
            include: { factory: true }
        });

        if (!lead) {
            throw new Error('Lead not found');
        }

        const totalAmount = data.quantity * data.unitPrice;

        const order = await prisma.$transaction(async (tx: any) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    factoryId,
                    leadId,
                    customerPhone: lead.customerPhone,
                    customerName: lead.customerName,
                    productName: data.productName,
                    quantity: data.quantity,
                    unitPrice: data.unitPrice,
                    totalAmount,
                    source: OrderSource.DASHBOARD,
                    notes: data.notes,
                    orderStatus: OrderStatus.PENDING,
                },
            });

            // Close lead
            await tx.lead.update({
                where: { id: leadId },
                data: {
                    status: LeadStatus.CLOSED,
                    closedAt: new Date(),
                    leadValue: totalAmount,
                },
            });

            return newOrder;
        });

        return order;
    }

    /**
     * n8n Integration: Create order directly from automation
     */
    public async createOrderFromAutomation(factoryId: string, data: any) {
        const totalAmount = data.quantity * data.unitPrice;

        // Try to find an existing lead by phone
        const lead = await prisma.lead.findFirst({
            where: { factoryId, customerPhone: data.customerPhone },
            orderBy: { createdAt: 'desc' }
        });

        const order = await prisma.order.create({
            data: {
                factoryId,
                leadId: lead?.id || null, // Link to lead if exists
                customerPhone: data.customerPhone,
                customerName: data.customerName,
                productName: data.productName,
                quantity: data.quantity,
                unitPrice: data.unitPrice,
                totalAmount,
                source: OrderSource.API,
                notes: data.notes,
                orderStatus: OrderStatus.PENDING,
            },
        });

        return order;
    }

    /**
     * Update order status
     */
    public async updateOrderStatus(factoryId: string, orderId: string, status: OrderStatus) {
        const order = await prisma.order.findFirst({
            where: { id: orderId, factoryId }
        });

        if (!order) throw new Error('Order not found');

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { orderStatus: status }
        });

        return updated;
    }

    /**
     * Query paginated orders with filters
     */
    public async getOrders(factoryId: string, filters: any, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where: any = { factoryId };

        if (filters.orderStatus) where.orderStatus = filters.orderStatus;
        if (filters.customerPhone) where.customerPhone = { contains: filters.customerPhone };

        // Handling date ranges if provided
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
            if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
        }

        const [orders, totalCount] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return {
            orders,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
            }
        };
    }

    /**
     * Get single order details
     */
    public async getOrderDetails(factoryId: string, orderId: string) {
        return prisma.order.findFirst({
            where: { id: orderId, factoryId },
            include: { lead: true }
        });
    }

    /**
     * Generate Revenue Analytics grouping by day/month matching
     */
    public async getRevenueAnalytics(factoryId: string) {
        // Simplified metrics logic
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalOrders, totalRevenueData, ordersThisMonth, allCompleted] = await Promise.all([
            prisma.order.count({ where: { factoryId } }),
            prisma.order.aggregate({
                where: { factoryId, orderStatus: { in: ['COMPLETED', 'SHIPPED', 'CONFIRMED'] } },
                _sum: { totalAmount: true }
            }),
            prisma.order.count({
                where: { factoryId, createdAt: { gte: startOfMonth } }
            }),
            prisma.order.aggregate({
                where: { factoryId, orderStatus: { in: ['COMPLETED', 'SHIPPED', 'CONFIRMED'] } },
                _avg: { totalAmount: true }
            })
        ]);

        const totalRevenue = totalRevenueData._sum.totalAmount || 0;
        const averageOrderValue = allCompleted._avg.totalAmount || 0;

        return {
            totalOrders,
            totalRevenue,
            ordersThisMonth,
            averageOrderValue
        };
    }
}

export const orderService = new OrderService();
