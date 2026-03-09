import { Router } from 'express';
import multer from 'multer';
import {
    createContact,
    getContacts,
    getContact,
    updateContact,
    deleteContact,
    deleteContacts,
    importContacts,
    previewImport,
    getImportHistory,
    createContactList,
    getContactLists,
    getContactListDetails,
    addContactsToList,
    removeContactsFromList,
    deleteContactList,
    getContactCount,
} from '../../controllers/contact.controller';
import { protect } from '../../middlewares/firebase-auth.middleware';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/csv',
        ];
        if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'));
        }
    },
});

router.use(protect);

// Contacts CRUD
router.route('/')
    .post(createContact)
    .get(getContacts);

router.route('/count')
    .get(getContactCount);

router.route('/bulk-delete')
    .post(deleteContacts);

// Import
router.route('/import')
    .post(upload.single('file'), importContacts);

router.route('/import/preview')
    .post(upload.single('file'), previewImport);

router.route('/import/history')
    .get(getImportHistory);

// Contact Lists
router.route('/lists')
    .post(createContactList)
    .get(getContactLists);

router.route('/lists/:id')
    .get(getContactListDetails)
    .delete(deleteContactList);

router.route('/lists/:id/members')
    .post(addContactsToList)
    .delete(removeContactsFromList);

// Single contact
router.route('/:id')
    .get(getContact)
    .put(updateContact)
    .delete(deleteContact);

export default router;
