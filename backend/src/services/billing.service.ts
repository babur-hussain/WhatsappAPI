import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../config/database';
import { Factory } from '@prisma/client';

let razorpayClient: Razorpay | null = null;

const getRazorpayClient = () => {
    if (!razorpayClient) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Billing features will be disabled.');
            throw new Error('Razorpay credentials missing');
        }
        razorpayClient = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayClient;
};

export const billingService = {
    async createCustomer(factory: Factory) {
        if (factory.email && factory.phone) {
            const customer = await getRazorpayClient().customers.create({
                name: factory.factoryName,
                email: factory.email,
                contact: factory.phone,
                notes: {
                    factoryId: factory.id,
                },
            });
            return customer;
        }
        throw new Error('Factory email and phone required');
    },

    async createSubscription(factoryId: string, razorpayCustomerId: string, planId: string) {
        // Note: planId corresponds to Razorpay Plan ID
        const options: any = {
            plan_id: planId,
            customer_id: razorpayCustomerId,
            total_count: 120, // Example mapping - typically ongoing
            customer_notify: 1,
        };
        const subscription: any = await getRazorpayClient().subscriptions.create(options);

        return subscription;
    },

    verifyPayment(razorpay_payment_id: string, razorpay_subscription_id: string, razorpay_signature: string) {
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(razorpay_payment_id + '|' + razorpay_subscription_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            throw new Error('Signature verification failed');
        }

        return true;
    },

    verifyWebhookSignature(body: string, signature: string) {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
            .update(body)
            .digest('hex');

        return expectedSignature === signature;
    },

    async cancelSubscription(subscriptionId: string) {
        const cancelled = await getRazorpayClient().subscriptions.cancel(subscriptionId);
        return cancelled;
    }
};
