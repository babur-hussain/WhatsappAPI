import Redis from 'ioredis';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from './env.config';
import { logger } from './logger';
import { Request } from 'express';

// Secure Redis Initialization
export const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
});

redis.on('error', (err) => {
    logger.error('Redis connection error:', err);
});

redis.on('connect', () => {
    logger.info('Connected to Redis securely');
});

// Cache Helpers
export const cacheSet = async (key: string, value: any, ttlSeconds: number = 300) => {
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
        logger.error(`Failed to set cache for key ${key}`, err);
    }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        logger.error(`Failed to get cache for key ${key}`, err);
        return null;
    }
};

export const cacheDelete = async (key: string) => {
    try {
        await redis.del(key);
    } catch (err) {
        logger.error(`Failed to delete cache for key ${key}`, err);
    }
};

// Rate Limiters
// 1. Global IP Rate Limiter (e.g. 100 reqs/min per IP)
export const globalRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        // @ts-expect-error
        sendCommand: (...args: string[]) => redis.call(...args),
    }),
    validate: { xForwardedForHeader: false, default: false }, // Fix IPv6 ERR_ERL_KEY_GEN_IPV6
    handler: (req, res) => {
        logger.warn(`Global Rate Limit Exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, error: { message: 'Too many requests.', code: 'RATE_LIMIT_EXCEEDED' } });
    }
});

// 2. Factory-Bound Rate Limiter (e.g. 1000 reqs/min per Factory)
export const factoryRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
        // Fallback to IP if factoryId isn't loaded on req yet (e.g. pre-auth endpoints)
        return req.user?.factoryId || req.ip || 'unknown';
    },
    store: new RedisStore({
        // @ts-expect-error
        sendCommand: (...args: string[]) => redis.call(...args),
    }),
    validate: { xForwardedForHeader: false, default: false }, // Fix IPv6 ERR_ERL_KEY_GEN_IPV6
    handler: (req: any, res) => {
        logger.warn(`Factory Rate Limit Exceeded for Entity: ${req.user?.factoryId || req.ip}`);
        res.status(429).json({ success: false, error: { message: 'Factory API rate limit exceeded.', code: 'FACTORY_RATE_LIMIT' } });
    }
});
