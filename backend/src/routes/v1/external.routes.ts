import { Router, Response } from 'express';
import { z } from 'zod';
import { verifyApiKey, apiRateLimiter, ApiKeyRequest } from '../../middlewares/api-key.middleware';
import { externalService } from '../../services/external.service';
import { logger } from '../../config/logger';

const router = Router();

// ─── Zod Validation Schemas ───────────────────────────────────────────────────

const sendMessageSchema = z.object({
    to: z.string().min(10).max(15).regex(/^[\d+]+$/, 'Phone number must contain only digits and optional +'),
    message: z.string().min(1).max(4096),
    correlationId: z.string().max(128).optional(),
});

const sendTemplateSchema = z.object({
    to: z.string().min(10).max(15).regex(/^[\d+]+$/, 'Phone number must contain only digits and optional +'),
    templateName: z.string().min(1).max(512).regex(/^[a-z0-9_]+$/, 'Template name must be lowercase alphanumeric with underscores'),
    languageCode: z.string().min(2).max(5).default('en'),
    components: z.array(z.any()).optional(),
    correlationId: z.string().max(128).optional(),
});

const sendDocumentSchema = z.object({
    to: z.string().min(10).max(15).regex(/^[\d+]+$/, 'Phone number must contain only digits and optional +'),
    documentUrl: z.string().url().max(2048),
    caption: z.string().max(1024).default(''),
    correlationId: z.string().max(128).optional(),
});

// ─── Middleware ────────────────────────────────────────────────────────────────

/**
 * External API for partner integrations (e.g. RestaurantSystem).
 * Authenticated via x-api-key header (factory's apiKey).
 * Secured with HMAC-SHA256 signature verification.
 * Rate-limited to 100 requests/minute per API key.
 */
router.use(apiRateLimiter);
router.use(verifyApiKey);

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/external/send-message
 * Send a plain text WhatsApp message.
 *
 * Body: { to: string, message: string, correlationId?: string }
 * Headers: x-api-key, x-timestamp, x-signature
 */
router.post('/send-message', async (req: ApiKeyRequest, res: Response) => {
    try {
        const parsed = sendMessageSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body',
                details: parsed.error.flatten().fieldErrors,
            });
        }

        const { to, message, correlationId } = parsed.data;
        const result = await externalService.sendMessage(req.factoryId!, to, message, correlationId);
        return res.json(result);
    } catch (error: any) {
        logger.error(`[External API] send-message error: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: 'Failed to send message. Please check your WhatsApp connection.',
        });
    }
});

/**
 * POST /api/v1/external/send-template
 * Send a template WhatsApp message (required for business-initiated conversations).
 *
 * Body: { to: string, templateName: string, languageCode?: string, components?: any[], correlationId?: string }
 * Headers: x-api-key, x-timestamp, x-signature
 */
router.post('/send-template', async (req: ApiKeyRequest, res: Response) => {
    try {
        const parsed = sendTemplateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body',
                details: parsed.error.flatten().fieldErrors,
            });
        }

        const { to, templateName, languageCode, components, correlationId } = parsed.data;
        const result = await externalService.sendTemplate(
            req.factoryId!,
            to,
            templateName,
            languageCode,
            components,
            correlationId
        );
        return res.json(result);
    } catch (error: any) {
        logger.error(`[External API] send-template error: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: 'Failed to send template message. Please check your WhatsApp connection.',
        });
    }
});

/**
 * POST /api/v1/external/send-document
 * Send a document/media WhatsApp message.
 *
 * Body: { to: string, documentUrl: string, caption?: string, correlationId?: string }
 * Headers: x-api-key, x-timestamp, x-signature
 */
router.post('/send-document', async (req: ApiKeyRequest, res: Response) => {
    try {
        const parsed = sendDocumentSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body',
                details: parsed.error.flatten().fieldErrors,
            });
        }

        const { to, documentUrl, caption, correlationId } = parsed.data;
        const result = await externalService.sendDocument(
            req.factoryId!,
            to,
            documentUrl,
            caption,
            correlationId
        );
        return res.json(result);
    } catch (error: any) {
        logger.error(`[External API] send-document error: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: 'Failed to send document. Please check your WhatsApp connection.',
        });
    }
});

/**
 * GET /api/v1/external/message-status/:messageId
 * Check the delivery status of a message by log ID, Meta message ID, or correlationId.
 *
 * Headers: x-api-key, x-timestamp, x-signature
 */
router.get('/message-status/:messageId', async (req: ApiKeyRequest, res: Response) => {
    try {
        const { messageId } = req.params;

        if (!messageId || messageId.length > 128) {
            return res.status(400).json({ success: false, error: 'Invalid messageId' });
        }

        const status = await externalService.getMessageStatus(req.factoryId!, messageId);

        if (!status) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }

        return res.json({ success: true, data: status });
    } catch (error: any) {
        logger.error(`[External API] message-status error: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch message status',
        });
    }
});

/**
 * GET /api/v1/external/health
 * Simple health check for partner integration validation.
 */
router.get('/health', async (req: ApiKeyRequest, res: Response) => {
    return res.json({
        success: true,
        status: 'connected',
        factoryId: req.factoryId,
        timestamp: new Date().toISOString(),
    });
});

export default router;
