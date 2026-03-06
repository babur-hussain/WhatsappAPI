import { Router } from 'express';
import * as leadController from '../../controllers/lead.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware';

const router = Router();

// Protect all routes with auth AND active subscription check
router.use(protect, requireActiveSubscription);

router.get('/stats', leadController.getLeadStats);
router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLead);
router.patch('/:id/status', leadController.updateLeadStatus);
router.patch('/:id', leadController.updateLeadDetails);

export default router;
