import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import { contactService } from '../services/contact.service';
import { ContactSource } from '@prisma/client';
import catchAsync from '../utils/catch-async';
import { successResponse, errorResponse } from '../api/dto/response.dto';

// ─── Single Contact CRUD ────────────────────────────────────────────────────

export const createContact = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { phone, name, email, company, tags, customFields } = req.body;
    if (!phone) return res.status(400).json(errorResponse('Phone number is required'));

    try {
        const contact = await contactService.createContact(factoryId, { phone, name, email, company, tags, customFields });
        res.status(201).json(successResponse(contact));
    } catch (error) {
        res.status(400).json(errorResponse((error as Error).message));
    }
});

export const getContacts = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { search, source, page, limit } = req.query;
    const result = await contactService.getContacts(factoryId, {
        search: search as string,
        source: source as ContactSource,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 50,
    });

    res.status(200).json(successResponse(result));
});

export const getContact = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    try {
        const contact = await contactService.getContact(factoryId, req.params.id);
        res.status(200).json(successResponse(contact));
    } catch (error) {
        res.status(404).json(errorResponse((error as Error).message));
    }
});

export const updateContact = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    try {
        const contact = await contactService.updateContact(factoryId, req.params.id, req.body);
        res.status(200).json(successResponse(contact));
    } catch (error) {
        res.status(400).json(errorResponse((error as Error).message));
    }
});

export const deleteContact = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    try {
        await contactService.deleteContact(factoryId, req.params.id);
        res.status(200).json(successResponse({ message: 'Contact deleted' }));
    } catch (error) {
        res.status(404).json(errorResponse((error as Error).message));
    }
});

export const deleteContacts = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { contactIds } = req.body;
    if (!contactIds || !Array.isArray(contactIds)) {
        return res.status(400).json(errorResponse('contactIds array is required'));
    }

    const result = await contactService.deleteContacts(factoryId, contactIds);
    res.status(200).json(successResponse(result));
});

// ─── Import CSV/Excel ───────────────────────────────────────────────────────

export const previewImport = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const file = (req as any).file;
    if (!file) return res.status(400).json(errorResponse('File is required'));

    const fileName = file.originalname || 'import';
    const ext = fileName.split('.').pop()?.toLowerCase();

    try {
        const previewData = contactService.getFilePreview(file.buffer, ext);
        res.status(200).json(successResponse(previewData));
    } catch (error) {
        res.status(400).json(errorResponse(`Preview failed: ${(error as Error).message}`));
    }
});

export const importContacts = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const file = (req as any).file;
    if (!file) return res.status(400).json(errorResponse('File is required'));

    const mappingsStr = req.body.mappings;
    let mappings = undefined;
    if (mappingsStr) {
        try { mappings = JSON.parse(mappingsStr); } catch {}
    }

    const skipEmptyRows = req.body.skipEmptyRows !== 'false';

    const fileName = file.originalname || 'import';
    const ext = fileName.split('.').pop()?.toLowerCase();

    let rows;
    let source: ContactSource;

    try {
        if (ext === 'csv') {
            rows = contactService.parseCSV(file.buffer, skipEmptyRows, mappings);
            source = ContactSource.CSV_IMPORT;
        } else if (ext === 'xlsx' || ext === 'xls') {
            rows = contactService.parseExcel(file.buffer, mappings);
            source = ContactSource.EXCEL_IMPORT;
        } else {
            return res.status(400).json(errorResponse('Unsupported file type. Use CSV or Excel (.xlsx, .xls)'));
        }

        if (rows.length === 0) {
            return res.status(400).json(errorResponse('File contains no data rows'));
        }

        if (rows.length > 10000) {
            return res.status(400).json(errorResponse('File exceeds maximum of 10,000 rows'));
        }

        const result = await contactService.bulkImportContacts(factoryId, rows, source, fileName, skipEmptyRows);
        res.status(200).json(successResponse(result));
    } catch (error) {
        res.status(400).json(errorResponse(`Import failed: ${(error as Error).message}`));
    }
});

export const getImportHistory = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const history = await contactService.getImportHistory(factoryId);
    res.status(200).json(successResponse(history));
});

// ─── Contact Lists ──────────────────────────────────────────────────────────

export const createContactList = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { name, description, contactIds } = req.body;
    if (!name) return res.status(400).json(errorResponse('List name is required'));

    const list = await contactService.createContactList(factoryId, name, description, contactIds);
    res.status(201).json(successResponse(list));
});

export const getContactLists = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const lists = await contactService.getContactLists(factoryId);
    res.status(200).json(successResponse(lists));
});

export const getContactListDetails = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    try {
        const result = await contactService.getContactListMembers(factoryId, req.params.id, page, limit);
        res.status(200).json(successResponse(result));
    } catch (error) {
        res.status(404).json(errorResponse((error as Error).message));
    }
});

export const addContactsToList = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { contactIds } = req.body;
    if (!contactIds || !Array.isArray(contactIds)) {
        return res.status(400).json(errorResponse('contactIds array is required'));
    }

    try {
        const result = await contactService.addContactsToList(factoryId, req.params.id, contactIds);
        res.status(200).json(successResponse(result));
    } catch (error) {
        res.status(400).json(errorResponse((error as Error).message));
    }
});

export const removeContactsFromList = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const { contactIds } = req.body;
    if (!contactIds || !Array.isArray(contactIds)) {
        return res.status(400).json(errorResponse('contactIds array is required'));
    }

    try {
        const result = await contactService.removeContactsFromList(factoryId, req.params.id, contactIds);
        res.status(200).json(successResponse(result));
    } catch (error) {
        res.status(400).json(errorResponse((error as Error).message));
    }
});

export const deleteContactList = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    try {
        await contactService.deleteContactList(factoryId, req.params.id);
        res.status(200).json(successResponse({ message: 'Contact list deleted' }));
    } catch (error) {
        res.status(404).json(errorResponse((error as Error).message));
    }
});

// ─── Contact Count ──────────────────────────────────────────────────────────

export const getContactCount = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const count = await contactService.getContactCount(factoryId);
    res.status(200).json(successResponse({ count }));
});
