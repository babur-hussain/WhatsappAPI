import { Router } from 'express';
import { protect } from '../../middlewares/firebase-auth.middleware';
import * as whatsappController from '../../controllers/whatsapp.controller';

const router = Router();

// All routes require authentication
router.use(protect);

router.post('/verify', whatsappController.verifyWhatsApp);
router.put('/connect', whatsappController.connectWhatsApp);
router.get('/status', whatsappController.getWhatsAppStatus);
router.post('/disconnect', whatsappController.disconnectWhatsApp);

export default router;
