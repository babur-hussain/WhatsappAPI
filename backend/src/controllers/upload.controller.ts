import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import { storageService } from '../services/storage.service';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';

const ALLOWED_MIME_TYPES = new Set([
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Video
    'video/mp4',
    'video/3gpp',
    'video/quicktime',
    // Audio
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/aac',
    'audio/opus',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
]);

/**
 * POST /api/v1/upload/media
 * Uploads a single file to AWS S3 and returns its URL.
 * Field name: "file" (multipart/form-data)
 */
export const uploadMedia = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const file = req.file;

    if (!factoryId) {
        return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    }

    if (!file) {
        return res.status(400).json(errorResponse('No file uploaded. Use field name "file".', 'BAD_REQUEST'));
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return res
            .status(400)
            .json(errorResponse(`File type "${file.mimetype}" is not supported.`, 'UNSUPPORTED_MEDIA_TYPE'));
    }

    const { url, key } = await storageService.uploadMedia(file, factoryId, 'media');

    return res.status(201).json(
        successResponse({
            url,
            key,
            mimeType: file.mimetype,
            originalName: file.originalname,
            sizeBytes: file.size,
        }),
    );
});
