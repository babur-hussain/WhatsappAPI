import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import { templateService } from '../services/template.service';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';

// ─── List Templates ─────────────────────────────────────────────────────────

export const getTemplates = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { status, category, name, limit, after } = req.query;

    try {
        const result = await templateService.getTemplates(factoryId, {
            status: status as string,
            category: category as string,
            name: name as string,
            limit: limit ? parseInt(limit as string) : undefined,
            after: after as string,
        });
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).json(successResponse(result));
    } catch (error) {
        res.status(400).json(errorResponse((error as Error).message));
    }
});

// ─── Get Single Template ────────────────────────────────────────────────────

export const getTemplate = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { id } = req.params;

    try {
        const template = await templateService.getTemplate(factoryId, id);
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).json(successResponse(template));
    } catch (error) {
        res.status(404).json(errorResponse((error as Error).message));
    }
});

// ─── Create Template ────────────────────────────────────────────────────────

export const createTemplate = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { name, category, language, components, allow_category_change } = req.body;

    if (!name || !category || !language || !components) {
        return res.status(400).json(errorResponse('Missing required fields: name, category, language, components'));
    }

    // Validate template name (lowercase alphanumeric and underscores only)
    if (!/^[a-z0-9_]+$/.test(name)) {
        return res.status(400).json(errorResponse('Template name must contain only lowercase letters, numbers, and underscores'));
    }

    try {
        const result = await templateService.createTemplate(factoryId, {
            name,
            category,
            language,
            components,
            allow_category_change,
        });
        res.status(201).json(successResponse(result));
    } catch (error) {
        res.status(400).json(errorResponse((error as Error).message));
    }
});

// ─── Update Template ────────────────────────────────────────────────────────

export const updateTemplate = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { id } = req.params;
    const { components, category } = req.body;

    try {
        const result = await templateService.updateTemplate(factoryId, id, { components, category });
        res.status(200).json(successResponse(result));
    } catch (error) {
        res.status(400).json(errorResponse((error as Error).message));
    }
});

// ─── Delete Template ────────────────────────────────────────────────────────

export const deleteTemplate = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { name } = req.params;

    if (!name) {
        return res.status(400).json(errorResponse('Template name is required'));
    }

    try {
        const result = await templateService.deleteTemplate(factoryId, name);
        res.status(200).json(successResponse(result));
    } catch (error) {
        res.status(400).json(errorResponse((error as Error).message));
    }
});

// ─── Send Template (Single) ─────────────────────────────────────────────────

export const sendTemplate = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { to, templateName, languageCode, components, templateContent } = req.body;

    if (!to || !templateName || !languageCode) {
        return res.status(400).json(errorResponse('Missing required fields: to, templateName, languageCode'));
    }

    try {
        const result = await templateService.sendTemplate(factoryId, {
            to,
            templateName,
            languageCode,
            components,
            templateContent,
        });
        res.status(200).json(successResponse(result));
    } catch (error) {
        res.status(400).json(errorResponse((error as Error).message));
    }
});

// ─── Bulk Send Template ─────────────────────────────────────────────────────

export const bulkSendTemplate = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { templateName, languageCode, components, targetType, templateContent } = req.body;

    if (!templateName || !languageCode || !targetType) {
        return res.status(400).json(errorResponse('Missing required fields: templateName, languageCode, targetType'));
    }

    try {
        const result = await templateService.bulkSendTemplate(factoryId, {
            templateName,
            languageCode,
            components,
            targetType,
            templateContent,
        });
        res.status(201).json(successResponse(result));
    } catch (error) {
        res.status(400).json(errorResponse((error as Error).message));
    }
});
