import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { verifyFirebaseToken } from '../../middlewares/firebase-auth.middleware';

const router = Router();

router.post('/sync', verifyFirebaseToken, authController.sync);
router.get('/me', verifyFirebaseToken, authController.me);

export default router;
