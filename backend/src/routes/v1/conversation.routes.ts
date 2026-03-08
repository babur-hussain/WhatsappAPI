import { Router } from 'express';
import { protect } from '../../middlewares/firebase-auth.middleware';
import * as conversationController from '../../controllers/conversation.controller';

const router = Router();

router.use(protect);

router.get('/', conversationController.getConversations);
router.get('/:leadId/messages', conversationController.getMessages);
router.post('/:leadId/reply', conversationController.sendReply);
router.get('/:leadId/suggest', conversationController.getSuggestedReply);
router.post('/:leadId/read', conversationController.markAsRead);

export default router;
