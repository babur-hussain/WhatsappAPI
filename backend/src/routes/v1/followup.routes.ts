import { Router } from 'express';
import * as followUpController from '../../controllers/followup.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';

const router = Router();

router.use(protect);

router.get('/settings', followUpController.getFollowUpSettings);
router.patch('/settings', followUpController.updateFollowUpSettings);

export default router;
