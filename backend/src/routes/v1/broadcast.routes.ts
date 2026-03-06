import { Router } from 'express';
import { createBroadcast, getBroadcasts, getBroadcastDetails } from '../../controllers/broadcast.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';

const router = Router();

router.use(protect); // Require auth for all broadcast routes

router.route('/')
    .post(createBroadcast)
    .get(getBroadcasts);

router.route('/:id')
    .get(getBroadcastDetails);

export default router;
