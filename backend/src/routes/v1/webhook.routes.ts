import { Router } from 'express';
import * as webhookController from '../../controllers/webhook.controller';

const router = Router();

router.get('/', webhookController.verifyWebhook);
router.post('/', webhookController.receiveWebhook);

export default router;
