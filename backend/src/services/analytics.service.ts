import prisma from '../config/database';
import { LeadStatus } from '@prisma/client';
import { cacheGet, cacheSet } from '../config/redis';

const CACHE_TTL = 60; // 60 seconds

export class AnalyticsService {
    /**
     * Dashboard summary stats
     */
    public async getDashboard(factoryId: string | null) {
        const cacheKey = `analytics:dashboard:${factoryId || 'global'}`;
        const cached = await cacheGet<any>(cacheKey);
        if (cached) return cached;

        const where = factoryId ? { factoryId } : {};

        const [totalLeads, newLeads, contactedLeads, closedLeads, avgResponseTime] = await Promise.all([
            prisma.lead.count({ where }),
            prisma.lead.count({ where: { ...where, status: LeadStatus.NEW } }),
            prisma.lead.count({ where: { ...where, status: LeadStatus.CONTACTED } }),
            prisma.lead.count({ where: { ...where, status: LeadStatus.CLOSED } }),
            prisma.lead.aggregate({
                where: { ...where, responseTimeSeconds: { not: null } },
                _avg: { responseTimeSeconds: true },
            }),
        ]);

        const conversionRate = totalLeads > 0
            ? parseFloat(((closedLeads / totalLeads) * 100).toFixed(2))
            : 0;

        const averageResponseTime = avgResponseTime._avg.responseTimeSeconds
            ? Math.round(avgResponseTime._avg.responseTimeSeconds)
            : null;

        const result = {
            totalLeads,
            newLeads,
            contactedLeads,
            closedLeads,
            conversionRate,
            averageResponseTime,
        };

        await cacheSet(cacheKey, result, CACHE_TTL);
        return result;
    }

    /**
     * Leads grouped by day (last 30 days)
     */
    public async getLeadsOverTime(factoryId: string | null) {
        const cacheKey = `analytics:leads-over-time:${factoryId || 'global'}`;
        const cached = await cacheGet<any>(cacheKey);
        if (cached) return cached;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const where: any = { createdAt: { gte: thirtyDaysAgo } };
        if (factoryId) where.factoryId = factoryId;

        const leads = await prisma.lead.findMany({
            where,
            select: { createdAt: true, status: true },
            orderBy: { createdAt: 'asc' },
        });

        // Group by day
        const dayMap = new Map<string, { total: number; new: number; contacted: number; closed: number }>();

        for (const lead of leads) {
            const day = lead.createdAt.toISOString().split('T')[0];
            if (!dayMap.has(day)) {
                dayMap.set(day, { total: 0, new: 0, contacted: 0, closed: 0 });
            }
            const entry = dayMap.get(day)!;
            entry.total++;
            if (lead.status === LeadStatus.NEW) entry.new++;
            else if (lead.status === LeadStatus.CONTACTED) entry.contacted++;
            else if (lead.status === LeadStatus.CLOSED) entry.closed++;
        }

        const result = Array.from(dayMap.entries()).map(([date, counts]) => ({
            date,
            ...counts,
        }));

        await cacheSet(cacheKey, result, CACHE_TTL);
        return result;
    }

    /**
     * Top requested products
     */
    public async getTopProducts(factoryId: string | null) {
        const cacheKey = `analytics:top-products:${factoryId || 'global'}`;
        const cached = await cacheGet<any>(cacheKey);
        if (cached) return cached;

        const where: any = { productInterest: { not: null } };
        if (factoryId) where.factoryId = factoryId;

        const leads = await prisma.lead.findMany({
            where,
            select: { productInterest: true },
        });

        const productMap = new Map<string, number>();
        for (const lead of leads) {
            if (lead.productInterest) {
                const product = lead.productInterest.trim().toLowerCase();
                productMap.set(product, (productMap.get(product) || 0) + 1);
            }
        }

        const result = Array.from(productMap.entries())
            .map(([product, count]) => ({ product, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        await cacheSet(cacheKey, result, CACHE_TTL);
        return result;
    }

    /**
     * Sales performance per user
     */
    public async getSalesPerformance(factoryId: string | null) {
        const cacheKey = `analytics:sales-performance:${factoryId || 'global'}`;
        const cached = await cacheGet<any>(cacheKey);
        if (cached) return cached;

        const userWhere: any = { role: { in: ['ADMIN', 'SALES'] } };
        if (factoryId) userWhere.factoryId = factoryId;

        const salesUsers = await prisma.user.findMany({
            where: userWhere,
            select: {
                id: true,
                name: true,
                email: true,
                assignedLeads: {
                    select: { id: true, status: true },
                },
            },
        });

        const result = salesUsers.map((user) => {
            const totalLeads = user.assignedLeads.length;
            const closedLeads = user.assignedLeads.filter(
                (l) => l.status === LeadStatus.CLOSED
            ).length;
            const conversionRate = totalLeads > 0
                ? parseFloat(((closedLeads / totalLeads) * 100).toFixed(2))
                : 0;

            return {
                userId: user.id,
                name: user.name,
                email: user.email,
                totalLeads,
                closedLeads,
                conversionRate,
            };
        });

        await cacheSet(cacheKey, result, CACHE_TTL);
        return result;
    }
}

export const analyticsService = new AnalyticsService();
