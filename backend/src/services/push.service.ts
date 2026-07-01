import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export const pushService = {
    async sendPushNotification(
        pushTokens: string[],
        title: string,
        body: string,
        data: Record<string, any> = {}
    ) {
        const messages: ExpoPushMessage[] = [];
        for (const pushToken of pushTokens) {
            if (!Expo.isExpoPushToken(pushToken)) {
                console.error(`Push token ${pushToken} is not a valid Expo push token`);
                continue;
            }

            messages.push({
                to: pushToken,
                sound: 'default',
                title,
                body,
                data,
            });
        }

        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending push notifications chunk', error);
            }
        }

        return tickets;
    }
};
