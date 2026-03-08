import { Router } from 'express';
import multer from 'multer';
import { protect } from '../../middlewares/firebase-auth.middleware';
import * as uploadController from '../../controllers/upload.controller';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — WhatsApp max media size
});

router.use(protect);

/**
 * POST /api/v1/upload/media
 * Accepts: multipart/form-data with field name "file"
 * Returns: { url, key, mimeType, originalName, sizeBytes }
 */
router.post('/media', upload.single('file'), uploadController.uploadMedia);

export default router;
