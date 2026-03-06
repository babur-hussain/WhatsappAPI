import { Router } from 'express';
import * as notificationController from '../../controllers/notification.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';

const router = Router();

router.get('/', protect, notificationController.getNotifications);
router.patch('/:id/read', protect, notificationController.markNotificationRead);

export default router;
