import { Router } from 'express';
import * as catalogController from '../../controllers/catalog.controller';
import multer from 'multer';
import { protect } from '../../middlewares/firebase-auth.middleware';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and images are allowed.'));
        }
    }
});

router.use(protect, requireActiveSubscription);

router.post('/upload', upload.single('file'), catalogController.uploadCatalog);
router.get('/', catalogController.getCatalogs);
router.delete('/:id', catalogController.deleteCatalog);

export default router;
