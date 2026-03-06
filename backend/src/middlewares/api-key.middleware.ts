import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import prisma from '../config/database';
import { errorResponse } from '../api/dto/response.dto';

// Define custom request type extending Express Request
export interface ApiKeyRequest extends Request {
    factoryId?: string;
}

export const verifyApiKey = async (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    try {
        const apiKey = req.headers['x-api-key'] as string;

        if (!apiKey) {
            return res.status(401).json(errorResponse('Missing API Key', 'UNAUTHORIZED'));
        }

        const factory = await prisma.factory.findUnique({
            where: { apiKey }
        });

        if (!factory) {
            return res.status(401).json(errorResponse('Invalid API Key', 'UNAUTHORIZED'));
        }

        req.factoryId = factory.id;
        next();
    } catch (error) {
        return res.status(500).json(errorResponse('Internal server error during authentication', 'SERVER_ERROR'));
    }
};

// Rate limiting for API key endpoints (100 requests per minute)
export const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Limit each IP or Key to 100 requests per `window`
    keyGenerator: (req) => {
        // Tie rate limiting to the API key if present, otherwise IP
        return req.headers['x-api-key'] as string || req.ip || 'unknown';
    },
    message: errorResponse('Too many requests, please try again later.', 'RATE_LIMIT_EXCEEDED'),
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    validate: { xForwardedForHeader: false, default: false } // Fix IPv6 ERR_ERL_KEY_GEN_IPV6
});
