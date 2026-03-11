import { Router } from 'express';
import * as walletController from '../../controllers/wallet.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';

const router = Router();

// All wallet routes are protected
router.get('/', protect, walletController.getWallet);
router.post('/recharge', protect, walletController.createRechargeOrder);
router.post('/verify-recharge', protect, walletController.verifyRecharge);
router.get('/transactions', protect, walletController.getTransactions);

export default router;
