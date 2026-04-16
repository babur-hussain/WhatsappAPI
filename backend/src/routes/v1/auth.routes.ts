import { Router, Response } from 'express';
import { protect, AuthRequest } from '../../middlewares/firebase-auth.middleware';
import prisma from '../../config/database';
import { auth as firebaseAdmin } from '../../config/firebase';
import { successResponse, errorResponse } from '../../api/dto/response.dto';
import catchAsync from '../../utils/catch-async';

const router = Router();

// All team routes require authentication
router.use(protect);

// ─── GET /team — List all team members for the current factory ───────────────
router.get('/team', catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const users = await prisma.user.findMany({
        where: { factoryId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    res.json(successResponse({ users }));
}));

// ─── POST /invite — Invite/create a new team member ─────────────────────────
router.post('/invite', catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const callerRole = req.user?.role;

    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    if (callerRole !== 'FACTORY_ADMIN') {
        return res.status(403).json(errorResponse('Only admins can invite team members', 'FORBIDDEN'));
    }

    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json(errorResponse('Name, email, and password are required', 'VALIDATION_ERROR'));
    }

    if (password.length < 6) {
        return res.status(400).json(errorResponse('Password must be at least 6 characters', 'VALIDATION_ERROR'));
    }

    const validRoles = ['FACTORY_ADMIN', 'SALES'];
    if (role && !validRoles.includes(role)) {
        return res.status(400).json(errorResponse('Invalid role', 'VALIDATION_ERROR'));
    }

    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(409).json(errorResponse('A user with this email already exists', 'CONFLICT'));
    }

    // Create Firebase user
    let firebaseUser;
    try {
        firebaseUser = await firebaseAdmin.createUser({
            email,
            password,
            displayName: name,
        });
    } catch (e: any) {
        if (e.code === 'auth/email-already-exists') {
            return res.status(409).json(errorResponse('A user with this email already exists in Firebase', 'CONFLICT'));
        }
        throw e;
    }

    // Create database user linked to this factory
    const user = await prisma.user.create({
        data: {
            firebaseUid: firebaseUser.uid,
            factoryId,
            name,
            email,
            phone: phone || null,
            role: role || 'SALES',
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
        },
    });

    res.status(201).json(successResponse(user));
}));

// ─── DELETE /team/:id — Remove a team member ────────────────────────────────
router.delete('/team/:id', catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const callerRole = req.user?.role;
    const targetId = req.params.id;

    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    if (callerRole !== 'FACTORY_ADMIN') {
        return res.status(403).json(errorResponse('Only admins can remove team members', 'FORBIDDEN'));
    }

    // Don't allow removing yourself
    if (targetId === req.user?.id) {
        return res.status(400).json(errorResponse('You cannot remove yourself from the team', 'BAD_REQUEST'));
    }

    // Verify the target user belongs to this factory
    const targetUser = await prisma.user.findFirst({
        where: { id: targetId, factoryId },
    });

    if (!targetUser) {
        return res.status(404).json(errorResponse('Team member not found', 'NOT_FOUND'));
    }

    // Delete from Firebase
    try {
        await firebaseAdmin.deleteUser(targetUser.firebaseUid);
    } catch (e: any) {
        console.log('Firebase user deletion failed (may already be deleted):', e.message);
    }

    // Delete from database
    await prisma.user.delete({ where: { id: targetId } });

    res.json(successResponse({ message: 'Team member removed successfully' }));
}));

// ─── PATCH /team/:id/role — Update a team member's role ─────────────────────
router.patch('/team/:id/role', catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    const callerRole = req.user?.role;
    const targetId = req.params.id;

    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    if (callerRole !== 'FACTORY_ADMIN') {
        return res.status(403).json(errorResponse('Only admins can change roles', 'FORBIDDEN'));
    }

    const { role } = req.body;
    if (!role || !['FACTORY_ADMIN', 'SALES'].includes(role)) {
        return res.status(400).json(errorResponse('Invalid role', 'VALIDATION_ERROR'));
    }

    const targetUser = await prisma.user.findFirst({
        where: { id: targetId, factoryId },
    });

    if (!targetUser) {
        return res.status(404).json(errorResponse('Team member not found', 'NOT_FOUND'));
    }

    const updated = await prisma.user.update({
        where: { id: targetId },
        data: { role },
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    res.json(successResponse(updated));
}));

// ─── GET /export/leads — Export leads as CSV ────────────────────────────────
router.get('/export/leads', catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const leads = await prisma.lead.findMany({
        where: { factoryId },
        orderBy: { createdAt: 'desc' },
        select: {
            customerPhone: true,
            customerName: true,
            status: true,
            source: true,
            productInterest: true,
            createdAt: true,
        },
    });

    const headers = ['Phone', 'Name', 'Status', 'Source', 'Product Interest', 'Created At'];
    const rows = leads.map(l => [
        l.customerPhone,
        l.customerName || '',
        l.status,
        l.source,
        l.productInterest || '',
        new Date(l.createdAt).toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads_export.csv');
    res.send(csv);
}));

// ─── GET /export/contacts — Export contacts as CSV ──────────────────────────
router.get('/export/contacts', catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const contacts = await prisma.contact.findMany({
        where: { factoryId },
        orderBy: { createdAt: 'desc' },
        select: {
            phone: true,
            name: true,
            email: true,
            company: true,
            tags: true,
            source: true,
            createdAt: true,
        },
    });

    const headers = ['Phone', 'Name', 'Email', 'Company', 'Tags', 'Source', 'Created At'];
    const rows = contacts.map(c => [
        c.phone,
        c.name || '',
        c.email || '',
        c.company || '',
        Array.isArray(c.tags) ? c.tags.join(';') : '',
        c.source,
        new Date(c.createdAt).toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts_export.csv');
    res.send(csv);
}));

// ─── GET /export/orders — Export orders as CSV ──────────────────────────────
router.get('/export/orders', catchAsync(async (req: AuthRequest, res: Response) => {
    const factoryId = req.user?.factoryId;
    if (!factoryId) return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));

    const orders = await prisma.order.findMany({
        where: { factoryId },
        orderBy: { createdAt: 'desc' },
        select: {
            customerPhone: true,
            customerName: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            totalAmount: true,
            orderStatus: true,
            createdAt: true,
        },
    });

    const headers = ['Phone', 'Customer', 'Product', 'Qty', 'Unit Price', 'Total', 'Status', 'Created At'];
    const rows = orders.map(o => [
        o.customerPhone || '',
        o.customerName || '',
        o.productName || '',
        String(o.quantity),
        String(o.unitPrice),
        String(o.totalAmount),
        o.orderStatus,
        new Date(o.createdAt).toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders_export.csv');
    res.send(csv);
}));

export default router;
