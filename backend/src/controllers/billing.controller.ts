import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import { billingService } from '../services/billing.service';
import prisma from '../config/database';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';

export const createCustomer = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const factory = await prisma.factory.findUnique({ where: { id: factoryId } });
    if (!factory) return res.status(404).json(errorResponse('Factory not found', 'NOT_FOUND'));

    const customer = await billingService.createCustomer(factory);

    res.status(200).json(successResponse(customer));
});

export const createSubscription = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const { planId, planName } = req.body;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const factory = await prisma.factory.findUnique({ where: { id: factoryId } });
    if (!factory) return res.status(404).json(errorResponse('Factory not found', 'NOT_FOUND'));

    let customerId = req.body.customerId;

    if (!customerId) {
        // Find if we have active sub, or create customer
        const existingSub = await prisma.subscription.findFirst({ where: { factoryId } });
        if (existingSub?.razorpayCustomerId) {
            customerId = existingSub.razorpayCustomerId;
        } else {
            const newCustomer = await billingService.createCustomer(factory);
            customerId = newCustomer.id;
        }
    }

    const razorpaySub = await billingService.createSubscription(factoryId, customerId, planId);

    // Store subscription in DB as INACTIVE until payment is verified
    const subscription = await prisma.subscription.create({
        data: {
            factoryId,
            razorpayCustomerId: customerId,
            razorpaySubscriptionId: razorpaySub.id,
            planName: planName || 'Pro',
            status: SubscriptionStatus.INACTIVE
        }
    });

    res.status(200).json(successResponse({ subscription, razorpaySub }));
});

export const verifyPayment = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

    billingService.verifyPayment(razorpay_payment_id, razorpay_subscription_id, razorpay_signature);

    // Update subscription status in our DB
    const subscription = await prisma.subscription.update({
        where: { razorpaySubscriptionId: razorpay_subscription_id },
        data: { status: SubscriptionStatus.ACTIVE }
    });

    // Record payment
    await prisma.payment.create({
        data: {
            factoryId,
            razorpayPaymentId: razorpay_payment_id,
            amount: 0, // Usually get this from webhook or API
            currency: "INR",
            status: PaymentStatus.SUCCESS
        }
    });

    res.status(200).json(successResponse({ success: true, subscription }));
});

export const getSubscription = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const subscription = await prisma.subscription.findFirst({
        where: { factoryId },
        orderBy: { createdAt: 'desc' }
    });

    const payments = await prisma.payment.findMany({
        where: { factoryId },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    res.status(200).json(successResponse({ subscription, payments }));
});

export const cancelSubscription = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const subscription = await prisma.subscription.findFirst({
        where: { factoryId, status: SubscriptionStatus.ACTIVE }
    });

    if (!subscription || !subscription.razorpaySubscriptionId) {
        return res.status(404).json(errorResponse('No active subscription found', 'NOT_FOUND'));
    }

    await billingService.cancelSubscription(subscription.razorpaySubscriptionId);

    const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.CANCELLED }
    });

    res.status(200).json(successResponse(updated));
});

export const handleWebhook = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = JSON.stringify(req.body); // Assuming body-parser applies raw depending on setup, but typically express.json handles payload. 
    // For Razorpay, verifying the req.rawBody or original unparsed string is safer, but testing setup uses JSON.stringify mapping.

    if (!billingService.verifyWebhookSignature(rawBody, signature)) {
        return res.status(400).send('Invalid signature');
    }

    const { event, payload } = req.body;

    if (event === 'subscription.activated') {
        const subId = payload.subscription.entity.id;
        await prisma.subscription.update({
            where: { razorpaySubscriptionId: subId },
            data: { status: SubscriptionStatus.ACTIVE }
        });
    } else if (event === 'subscription.cancelled') {
        const subId = payload.subscription.entity.id;
        await prisma.subscription.update({
            where: { razorpaySubscriptionId: subId },
            data: { status: SubscriptionStatus.CANCELLED }
        });
    } else if (event === 'payment.captured') {
        const payment = payload.payment.entity;
        // You can extract factoryId via notes or subscription lookup
        const subId = payment.notes?.subscription_id;
        if (subId) {
            const sub = await prisma.subscription.findUnique({ where: { razorpaySubscriptionId: subId } });
            if (sub) {
                await prisma.payment.create({
                    data: {
                        factoryId: sub.factoryId,
                        razorpayPaymentId: payment.id,
                        amount: payment.amount / 100, // convert paise to main currency
                        currency: payment.currency,
                        status: PaymentStatus.SUCCESS
                    }
                });
            }
        }
    }

    res.status(200).send('Webhook processed');
});
