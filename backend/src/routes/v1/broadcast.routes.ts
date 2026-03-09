import { Router } from 'express';
import multer from 'multer';
import {
    createBroadcast,
    createBroadcastFromContacts,
    createBroadcastFromFile,
    getBroadcasts,
    getBroadcastDetails,
} from '../../controllers/broadcast.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'));
        }
    },
});

router.use(protect);

router.route('/')
    .post(createBroadcast)
    .get(getBroadcasts);

router.route('/from-contacts')
    .post(createBroadcastFromContacts);

router.route('/from-file')
    .post(upload.single('file'), createBroadcastFromFile);

router.route('/:id')
    .get(getBroadcastDetails);

export default router;
