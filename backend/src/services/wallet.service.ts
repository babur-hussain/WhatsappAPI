import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../config/database';
import { WalletTransactionType, WalletTransactionStatus } from '@prisma/client';

let razorpayClient: Razorpay | null = null;

const getRazorpayClient = () => {
    if (!razorpayClient) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay credentials missing');
        }
        razorpayClient = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayClient;
};

export const walletService = {
    /**
     * Get or create a wallet for the given factory.
     */
    async getOrCreateWallet(factoryId: string) {
        let wallet = await prisma.wallet.findUnique({ where: { factoryId } });
        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: { factoryId, balance: 0, currency: 'INR' },
            });
        }
        return wallet;
    },

    /**
     * Get current balance for a factory.
     */
    async getBalance(factoryId: string) {
        const wallet = await this.getOrCreateWallet(factoryId);
        return { balance: wallet.balance, currency: wallet.currency };
    },

    /**
     * Create a Razorpay Order for wallet recharge.
     */
    async createRechargeOrder(factoryId: string, amount: number) {
        if (amount <= 0) throw new Error('Amount must be greater than 0');

        // Ensure wallet exists
        await this.getOrCreateWallet(factoryId);

        const order = await getRazorpayClient().orders.create({
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: `wallet_${factoryId}_${Date.now()}`,
            notes: {
                factoryId,
                purpose: 'wallet_recharge',
            },
        });

        return {
            orderId: order.id,
            amount: amount,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
        };
    },

    /**
     * Verify Razorpay payment and credit the wallet atomically.
     */
    async verifyAndCreditRecharge(
        factoryId: string,
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string,
        amount: number
    ) {
        // 1. Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(razorpayOrderId + '|' + razorpayPaymentId)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            throw new Error('Payment signature verification failed');
        }

        // 2. Atomic credit using Prisma transaction
        const result = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { factoryId } });
            if (!wallet) throw new Error('Wallet not found');

            const newBalance = wallet.balance + amount;

            const updatedWallet = await tx.wallet.update({
                where: { factoryId },
                data: { balance: newBalance },
            });

            const transaction = await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: WalletTransactionType.CREDIT,
                    amount,
                    balanceAfter: newBalance,
                    description: `Wallet recharge via Razorpay`,
                    referenceId: razorpayPaymentId,
                    status: WalletTransactionStatus.SUCCESS,
                },
            });

            return { wallet: updatedWallet, transaction };
        });

        return result;
    },

    /**
     * Deduct balance from wallet atomically.
     * Used by other services (broadcasts, AI replies, etc.)
     */
    async deductBalance(
        factoryId: string,
        amount: number,
        description: string,
        referenceId?: string
    ) {
        if (amount <= 0) throw new Error('Deduction amount must be greater than 0');

        const result = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { factoryId } });
            if (!wallet) throw new Error('Wallet not found');

            if (wallet.balance < amount) {
                throw new Error('Insufficient wallet balance');
            }

            const newBalance = wallet.balance - amount;

            const updatedWallet = await tx.wallet.update({
                where: { factoryId },
                data: { balance: newBalance },
            });

            const transaction = await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: WalletTransactionType.DEBIT,
                    amount,
                    balanceAfter: newBalance,
                    description,
                    referenceId: referenceId || null,
                    status: WalletTransactionStatus.SUCCESS,
                },
            });

            return { wallet: updatedWallet, transaction };
        });

        return result;
    },

    /**
     * Get paginated transaction history for a factory.
     */
    async getTransactions(factoryId: string, page: number = 1, limit: number = 20) {
        const wallet = await this.getOrCreateWallet(factoryId);

        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            prisma.walletTransaction.findMany({
                where: { walletId: wallet.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.walletTransaction.count({
                where: { walletId: wallet.id },
            }),
        ]);

        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },
};
