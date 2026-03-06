import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { protect, AuthRequest } from '../../middlewares/firebase-auth.middleware';
import { requireSuperAdmin } from '../../middlewares/super-admin.middleware';
import { successResponse, errorResponse } from '../../api/dto/response.dto';

const router = Router();

// Apply auth and super admin middlewares to all admin routes
router.use(protect);
router.use(requireSuperAdmin);

// 1. GET /factories
router.get('/factories', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [factories, total] = await Promise.all([
            prisma.factory.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    subscriptions: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    _count: {
                        select: { leads: true, users: true }
                    }
                }
            }),
            prisma.factory.count()
        ]);

        const formattedFactories = factories.map(factory => {
            const currentSubscription = factory.subscriptions[0];
            return {
                id: factory.id,
                factoryName: factory.factoryName,
                ownerName: factory.ownerName,
                email: factory.email,
                phone: factory.phone,
                whatsappNumber: factory.whatsappNumber,
                isWhatsappConnected: factory.isWhatsappConnected,
                isActive: factory.isActive,
                subscriptionStatus: currentSubscription?.status || 'INACTIVE',
                leadsCount: factory._count.leads,
                usersCount: factory._count.users,
                createdAt: factory.createdAt
            };
        });

        res.json(successResponse({
            factories: formattedFactories,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }));
    } catch (error: any) {
        console.error('Error fetching admin factories:', error);
        res.status(500).json(errorResponse(error.message));
    }
});

// 2. GET /factories/:id
router.get('/factories/:id', async (req: AuthRequest, res: Response) => {
    try {
        const factory = await prisma.factory.findUnique({
            where: { id: req.params.id },
            include: {
                users: true,
                subscriptions: {
                    orderBy: { createdAt: 'desc' }
                },
                payments: {
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: { leads: true }
                }
            }
        });

        if (!factory) {
            return res.status(404).json(errorResponse('Factory not found', 'NOT_FOUND'));
        }

        res.json(successResponse(factory));
    } catch (error: any) {
        console.error('Error fetching admin factory details:', error);
        res.status(500).json(errorResponse(error.message));
    }
});

// 3. PATCH /factories/:id/status
router.patch('/factories/:id/status', async (req: AuthRequest, res: Response) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json(errorResponse('isActive must be a boolean', 'BAD_REQUEST'));
        }

        const factory = await prisma.factory.update({
            where: { id: req.params.id },
            data: { isActive }
        });

        res.json(successResponse(factory));
    } catch (error: any) {
        console.error('Error updating factory status:', error);
        res.status(500).json(errorResponse(error.message));
    }
});

// 4. GET /stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        // Calculate current month's start and end dates
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalFactories, activeFactories, totalLeads, revenueAggregate, monthlyRevenueAggregate] = await Promise.all([
            prisma.factory.count(),
            prisma.factory.count({ where: { isActive: true } }),
            prisma.lead.count(),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'SUCCESS' }
            }),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: 'SUCCESS',
                    createdAt: { gte: startOfMonth }
                }
            })
        ]);

        const totalRevenue = (revenueAggregate._sum.amount || 0) / 100; // Razorpay amounts are usually in paise
        const monthlyRevenue = (monthlyRevenueAggregate._sum.amount || 0) / 100;

        res.json(successResponse({
            totalFactories,
            activeFactories,
            totalLeads,
            totalRevenue,
            monthlyRevenue
        }));
    } catch (error: any) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json(errorResponse(error.message));
    }
});

// 5. GET /subscriptions
router.get('/subscriptions', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [subscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    factory: {
                        select: {
                            id: true,
                            factoryName: true,
                            ownerName: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.subscription.count()
        ]);

        res.json(successResponse({
            subscriptions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }));
    } catch (error: any) {
        console.error('Error fetching admin subscriptions:', error);
        res.status(500).json(errorResponse(error.message));
    }
});

// 6. GET /payments
router.get('/payments', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    factory: {
                        select: {
                            id: true,
                            factoryName: true,
                            ownerName: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.payment.count()
        ]);

        res.json(successResponse({
            payments,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }));
    } catch (error: any) {
        console.error('Error fetching admin payments:', error);
        res.status(500).json(errorResponse(error.message));
    }
});

export default router;
