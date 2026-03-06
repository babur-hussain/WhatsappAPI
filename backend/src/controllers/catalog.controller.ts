import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebase-auth.middleware';
import { storageService } from '../services/storage.service';
import prisma from '../config/database';
import catchAsync from '../utils/catch-async';
import { FileType } from '@prisma/client';
import { successResponse, errorResponse } from '../api/dto/response.dto';

export const uploadCatalog = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const file = req.file;

    if (!factoryId) {
        return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    }

    if (!file) {
        return res.status(400).json(errorResponse('No file uploaded', 'BAD_REQUEST'));
    }

    // Upload to S3
    const fileUrl = await storageService.uploadFile(file, factoryId);

    // Determine file type enum
    let fileType: FileType = FileType.IMAGE;
    if (file.mimetype === 'application/pdf') {
        fileType = FileType.PDF;
    }

    // Save record in database
    const catalog = await prisma.catalog.create({
        data: {
            factoryId,
            fileName: file.originalname,
            fileUrl,
            fileType,
        },
    });
    res.status(201).json(successResponse({
        message: 'Catalog uploaded successfully',
        catalog,
    }));
});

export const getCatalogs = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;

    if (!factoryId) {
        return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    }

    const catalogs = await prisma.catalog.findMany({
        where: { factoryId },
        orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(successResponse({ catalogs }));
});

export const deleteCatalog = catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const catalogId = req.params.id;

    if (!factoryId) {
        return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    }

    const catalog = await prisma.catalog.findFirst({
        where: { id: catalogId, factoryId },
    });

    if (!catalog) {
        return res.status(404).json(errorResponse('Catalog not found or unauthorized', 'NOT_FOUND'));
    }

    // Delete from storage
    await storageService.deleteFile(catalog.fileUrl);

    // Delete from database
    await prisma.catalog.delete({
        where: { id: catalogId },
    });

    res.status(200).json(successResponse({ message: 'Catalog deleted successfully' }));
});
