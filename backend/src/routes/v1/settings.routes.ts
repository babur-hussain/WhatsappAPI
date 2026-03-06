import { Router } from 'express';
import { getApiKey, regenerateApiKey, updateWebhookConfig } from '../../controllers/settings.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';

const router = Router();

router.use(protect);

router.route('/api-key')
    .get(getApiKey)
    .post(regenerateApiKey);

router.route('/webhook')
    .put(updateWebhookConfig);

export default router;
