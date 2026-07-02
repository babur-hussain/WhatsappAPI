import { Router } from 'express';
import { getApiKey, regenerateApiKey, regenerateApiSecret, updateWebhookConfig, getAutoReplySettings, updateAutoReplySettings, getWhatsappProfile, updateWhatsappProfile } from '../../controllers/settings.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';

const router = Router();

router.use(protect);

router.route('/api-key')
    .get(getApiKey)
    .post(regenerateApiKey);

router.post('/api-secret/regenerate', regenerateApiSecret);

router.route('/webhook')
    .put(updateWebhookConfig);

router.route('/auto-reply')
    .get(getAutoReplySettings)
    .patch(updateAutoReplySettings);

router.route('/whatsapp-profile')
    .get(getWhatsappProfile)
    .post(updateWhatsappProfile);

export default router;
