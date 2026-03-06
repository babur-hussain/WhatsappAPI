import { Router } from 'express';
import * as billingController from '../../controllers/billing.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';

const router = Router();

// Dashboard APIs (Protected)
router.post('/create-customer', protect, billingController.createCustomer);
router.post('/create-subscription', protect, billingController.createSubscription);
router.post('/verify-payment', protect, billingController.verifyPayment);
router.get('/subscription', protect, billingController.getSubscription);
router.post('/cancel', protect, billingController.cancelSubscription);

// Webhook (Publicly accessible but validated by signature internally)
router.post('/webhook', billingController.handleWebhook);

export default router;
