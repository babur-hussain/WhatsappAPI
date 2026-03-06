import { Router } from 'express';
import { protect } from '../../middlewares/firebase-auth.middleware';
import * as templateController from '../../controllers/template.controller';

const router = Router();

// All routes require authentication
router.use(protect);

// Template CRUD
router.route('/')
    .get(templateController.getTemplates)
    .post(templateController.createTemplate);

router.route('/:id')
    .get(templateController.getTemplate)
    .put(templateController.updateTemplate);

router.delete('/name/:name', templateController.deleteTemplate);

// Sending
router.post('/send', templateController.sendTemplate);
router.post('/bulk-send', templateController.bulkSendTemplate);

export default router;
