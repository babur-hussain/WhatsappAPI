import { Queue, Worker } from 'bullmq';
import { redis } from './redis';

// Define queues
export const messageQueue = new Queue('messageQueue', { connection: redis });
export const notificationQueue = new Queue('notificationQueue', { connection: redis });
export const aiQueue = new Queue('aiQueue', { connection: redis });
export const followUpQueue = new Queue('followUpQueue', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
export const broadcastQueue = new Queue('broadcastQueue', {
    connection: redis,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

// Queue Helper Functions
export const enqueueMessage = async (data: any) => {
    await messageQueue.add('processMessage', data, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
};

export const enqueueNotification = async (data: any) => {
    await notificationQueue.add('sendNotification', data, { attempts: 3 });
};

export const enqueueAiReply = async (data: any) => {
    await aiQueue.add('generateReply', data, { attempts: 2 });
};
