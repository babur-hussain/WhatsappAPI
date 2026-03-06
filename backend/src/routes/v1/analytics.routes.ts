import { Router } from 'express';
import * as analyticsController from '../../controllers/analytics.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';

const router = Router();

// All analytics routes require authentication
router.use(protect);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/leads-over-time', analyticsController.getLeadsOverTime);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/sales-performance', analyticsController.getSalesPerformance);

export default router;
