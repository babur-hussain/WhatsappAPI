import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import prisma from '../config/database';
import { errorResponse } from '../api/dto/response.dto';
import { logger } from '../config/logger';

// Define custom request type extending Express Request
export interface ApiKeyRequest extends Request {
    factoryId?: string;
}

/**
 * Maximum age of a request before it's rejected (5 minutes).
 * Prevents replay attacks.
 */
const MAX_REQUEST_AGE_MS = 5 * 60 * 1000;

/**
 * Verify the API key, HMAC signature, timestamp, and optional IP whitelist.
 *
 * Headers required:
 *   x-api-key     — the factory's public API key
 *   x-timestamp   — ISO 8601 timestamp of when the request was created
 *   x-signature   — HMAC-SHA256(apiSecret, timestamp + method + path + body)
 *
 * If the factory has `apiSecret` configured, signature verification is enforced.
 * If the factory has `allowedIps` configured, the client IP must be in the list.
 */
export const verifyApiKey = async (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    try {
        const apiKey = req.headers['x-api-key'] as string;
        const timestamp = req.headers['x-timestamp'] as string;
        const signature = req.headers['x-signature'] as string;

        if (!apiKey) {
            return res.status(401).json(errorResponse('Missing API Key', 'UNAUTHORIZED'));
        }

        // ── 1. Look up factory ───────────────────────────────────────────
        const factory = await prisma.factory.findUnique({
            where: { apiKey },
            select: {
                id: true,
                isActive: true,
                isWhatsappConnected: true,
                apiSecret: true,
                allowedIps: true,
            },
        });

        if (!factory || !factory.isActive) {
            return res.status(401).json(errorResponse('Invalid API Key', 'UNAUTHORIZED'));
        }

        // ── 2. IP whitelist check ────────────────────────────────────────
        if (factory.allowedIps) {
            const allowedList = factory.allowedIps.split(',').map(ip => ip.trim());
            const clientIp = req.ip || req.socket.remoteAddress || '';
            // Normalize IPv6-mapped IPv4 addresses (::ffff:127.0.0.1 → 127.0.0.1)
            const normalizedIp = clientIp.replace(/^::ffff:/, '');

            if (!allowedList.includes(normalizedIp) && !allowedList.includes(clientIp)) {
                logger.warn(`[External API] Blocked request from IP ${clientIp} (factory: ${factory.id})`);
                return res.status(403).json(errorResponse('Request from unauthorized IP', 'FORBIDDEN'));
            }
        }

        // ── 3. Timestamp validation (replay protection) ──────────────────
        if (factory.apiSecret) {
            if (!timestamp) {
                return res.status(401).json(errorResponse('Missing x-timestamp header', 'UNAUTHORIZED'));
            }

            const requestTime = new Date(timestamp).getTime();
            if (isNaN(requestTime)) {
                return res.status(401).json(errorResponse('Invalid x-timestamp format (use ISO 8601)', 'UNAUTHORIZED'));
            }

            const age = Math.abs(Date.now() - requestTime);
            if (age > MAX_REQUEST_AGE_MS) {
                return res.status(401).json(errorResponse('Request expired (timestamp too old or too far in future)', 'UNAUTHORIZED'));
            }

            // ── 4. HMAC signature verification ───────────────────────────
            if (!signature) {
                return res.status(401).json(errorResponse('Missing x-signature header', 'UNAUTHORIZED'));
            }

            // Build the string to sign: timestamp + HTTP method + path + raw body
            const method = req.method.toUpperCase();
            const path = req.originalUrl;
            const bodyStr = req.body ? JSON.stringify(req.body) : '';
            const stringToSign = `${timestamp}${method}${path}${bodyStr}`;

            const expectedSignature = crypto
                .createHmac('sha256', factory.apiSecret)
                .update(stringToSign)
                .digest('hex');

            // Timing-safe comparison to prevent timing attacks
            const sigBuffer = Buffer.from(signature, 'hex');
            const expectedBuffer = Buffer.from(expectedSignature, 'hex');

            if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
                logger.warn(`[External API] Invalid HMAC signature (factory: ${factory.id})`);
                return res.status(401).json(errorResponse('Invalid request signature', 'UNAUTHORIZED'));
            }
        }

        // ── 5. Attach factory ID to request ──────────────────────────────
        req.factoryId = factory.id;
        next();
    } catch (error) {
        logger.error('[External API] Auth middleware error', error);
        return res.status(500).json(errorResponse('Authentication service error', 'SERVER_ERROR'));
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
