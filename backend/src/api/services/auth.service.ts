import prisma from '../../config/database';
import { DecodedIdToken } from 'firebase-admin/auth';

export const authService = {
    async syncUser(firebaseToken: DecodedIdToken, bodyParams: any) {
        let user: any = await prisma.user.findUnique({
            where: { firebaseUid: firebaseToken.uid },
            include: {
                factory: {
                    include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } }
                }
            }
        });

        // If user already exists, return current info
        if (user) {
            const safeFactory = user.factory ? { ...user.factory } as any : null;
            if (safeFactory) {
                delete safeFactory.whatsappAccessToken;
                delete safeFactory.whatsappBusinessAccountId;
            }

            return {
                user: { id: user.id, email: user.email, name: user.name, role: user.role },
                factory: safeFactory,
                subscriptionStatus: user.factory?.subscriptions[0]?.status || 'INACTIVE',
                onboardingComplete: user.factory?.isOnboardingComplete || false
            };
        }

        // Otherwise, create Factory and User using body parameters and token info
        const { factoryName, ownerName, phone } = bodyParams || {};

        if (!factoryName || !ownerName) {
            // Since there's no factory metadata passed, this was likely a standard login attempt 
            // from the frontend where the Firebase record exists but the DB user doesn't.
            throw new Error('User account not found. Please register first.');
        }

        const email = firebaseToken.email || bodyParams.email;

        if (!email) {
            throw new Error('Email is missing from Firebase payload');
        }

        const factory = await prisma.factory.create({
            data: {
                factoryName,
                ownerName,
                email,
                phone: phone || null
            }
        });

        user = await prisma.user.create({
            data: {
                firebaseUid: firebaseToken.uid,
                factoryId: factory.id,
                name: ownerName,
                email,
                phone: phone || null,
                role: 'FACTORY_ADMIN' // Initial creator gets admin
            },
            include: { factory: { include: { subscriptions: true } } }
        });

        const safeFactory = { ...factory } as any;
        delete safeFactory.whatsappAccessToken;
        delete safeFactory.whatsappBusinessAccountId;

        return {
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            factory: safeFactory,
            subscriptionStatus: 'INACTIVE',
            onboardingComplete: false
        };
    },

    async getMe(firebaseToken: DecodedIdToken) {
        const user = await prisma.user.findUnique({
            where: { firebaseUid: firebaseToken.uid },
            include: {
                factory: {
                    include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } }
                }
            }
        });

        if (!user) throw new Error('User not found');

        const safeFactory = user.factory ? { ...user.factory } as any : null;
        if (safeFactory) {
            delete safeFactory.whatsappAccessToken;
            delete safeFactory.whatsappBusinessAccountId;
        }

        return {
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            factory: safeFactory,
            subscriptionStatus: user.factory?.subscriptions[0]?.status || 'INACTIVE',
            onboardingComplete: user.factory?.isOnboardingComplete || false
        };
    }
};
