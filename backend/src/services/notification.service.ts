import prisma from '../config/database';
import { NotificationType } from '@prisma/client';

export class NotificationService {
    /**
     * Create a new lead notification for the given factory
     */
    public async createNewLeadNotification(factoryId: string, customerPhone: string) {
        return await prisma.notification.create({
            data: {
                factoryId,
                type: NotificationType.NEW_LEAD,
                content: `New WhatsApp lead from +${customerPhone}`,
                isRead: false,
            },
        });
    }
}

export const notificationService = new NotificationService();
