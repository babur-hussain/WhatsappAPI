import { Router } from 'express';
import {
    createOrderFromLead,
    getOrders,
    getOrderDetails,
    updateOrderStatus,
    getRevenueAnalytics
} from '../../controllers/order.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';

const router = Router();

router.use(protect); // Require auth for all order routes

router.route('/')
    .get(getOrders);

router.route('/revenue')
    .get(getRevenueAnalytics);

router.route('/from-lead/:leadId')
    .post(createOrderFromLead);

router.route('/:id')
    .get(getOrderDetails);

router.route('/:id/status')
    .patch(updateOrderStatus);

export default router;
