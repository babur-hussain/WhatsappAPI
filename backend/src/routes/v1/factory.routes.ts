import { Router } from 'express';
import * as factoryController from '../../controllers/factory.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';

const router = Router();

router.use(protect);

router.patch('/whatsapp-number', factoryController.connectWhatsapp);
router.patch('/complete-onboarding', factoryController.completeOnboarding);

export default router;
