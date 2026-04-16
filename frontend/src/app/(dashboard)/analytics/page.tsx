"use client";

import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Clock,
    CheckCircle2,
    Users,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
    totalLeads: number;
    newLeads: number;
    contactedLeads: number;
    closedLeads: number;
    conversionRate: number;
    averageResponseTime: number | null;
}

interface LeadOverTime {
    date: string;
    total: number;
    new: number;
    contacted: number;
    closed: number;
}

interface TopProduct {
    product: string;
    count: number;
}

interface SalesPerformance {
    userId: string;
    name: string;
    email: string;
    totalLeads: number;
    closedLeads: number;
    conversionRate: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = 'https://whatsappapi.lfvs.in/api/v1/analytics';
const getHeaders = () => {
    const token = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/)?.[1] || '' : '';
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatResponseTime(seconds: number | null): string {
    if (seconds === null || seconds === undefined) return '—';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [leadsOverTime, setLeadsOverTime] = useState<LeadOverTime[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [salesPerformance, setSalesPerformance] = useState<SalesPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAll = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [dashRes, timeRes, prodRes, salesRes] = await Promise.all([
                fetch(`${API_BASE}/dashboard`, { headers: getHeaders() }),
                fetch(`${API_BASE}/leads-over-time`, { headers: getHeaders() }),
                fetch(`${API_BASE}/top-products`, { headers: getHeaders() }),
                fetch(`${API_BASE}/sales-performance`, { headers: getHeaders() }),
            ]);

            if (dashRes.ok) {
                const d = await dashRes.json();
                setDashboard(d.data);
            }
            if (timeRes.ok) {
                const d = await timeRes.json();
                setLeadsOverTime(d.data);
            }
            if (prodRes.ok) {
                const d = await prodRes.json();
                setTopProducts(d.data);
            }
            if (salesRes.ok) {
                const d = await salesRes.json();
                setSalesPerformance(d.data);
            }
        } catch (e) {
            console.log('Failed to fetch analytics', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    // Pie chart data
    const pieData = dashboard
        ? [
            { name: 'New', value: dashboard.newLeads },
            { name: 'Contacted', value: dashboard.contactedLeads },
            { name: 'Closed', value: dashboard.closedLeads },
        ]
        : [];

    // Line chart formatted data
    const lineData = leadsOverTime.map((d) => ({
        ...d,
        label: formatDate(d.date),
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-slate-500 text-sm font-medium">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Analytics
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Performance insights and lead conversion metrics.
                    </p>
                </div>
                <button
                    onClick={() => fetchAll(true)}
                    disabled={refreshing}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* ─── Stat Cards ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Total Leads */}
                <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-[60px]" />
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <ArrowUpRight className="w-3 h-3 mr-0.5" />
                            Live
                        </span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Total Leads</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-1">
                        {dashboard?.totalLeads ?? 0}
                    </h3>
                </div>

                {/* Conversion Rate */}
                <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-[60px]" />
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        {(dashboard?.conversionRate ?? 0) > 0 && (
                            <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                                {dashboard?.conversionRate}%
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-medium text-slate-500">Conversion Rate</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-1">
                        {dashboard?.conversionRate ?? 0}%
                    </h3>
                </div>

                {/* Avg Response Time */}
                <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-[60px]" />
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Avg Response Time</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-1">
                        {formatResponseTime(dashboard?.averageResponseTime ?? null)}
                    </h3>
                </div>

                {/* Closed Deals */}
                <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-[60px]" />
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-violet-600" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Closed Deals</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-1">
                        {dashboard?.closedLeads ?? 0}
                    </h3>
                </div>
            </div>

            {/* ─── Charts Row 1 ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Leads Over Time - Line Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Leads Over Time</h3>
                            <p className="text-sm text-slate-500 mt-0.5">Last 30 days</p>
                        </div>
                        <div className="flex items-center space-x-4 text-xs font-medium">
                            <span className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-1.5" />
                                Total
                            </span>
                            <span className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
                                Closed
                            </span>
                        </div>
                    </div>

                    <div className="h-[280px]">
                        {lineData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lineData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: '#fff',
                                            fontSize: '12px',
                                            padding: '12px 16px',
                                        }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#6366f1"
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: '#6366f1' }}
                                        activeDot={{ r: 5, strokeWidth: 0 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="closed"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{ r: 2.5, fill: '#10b981' }}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                        strokeDasharray="5 5"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                No data available yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Lead Status Breakdown - Pie Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Status Breakdown</h3>
                    <p className="text-sm text-slate-500 mb-6">Current lead distribution</p>

                    <div className="h-[200px]">
                        {pieData.some((d) => d.value > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: '#fff',
                                            fontSize: '12px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                No leads yet
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center space-x-6 mt-4">
                        {pieData.map((entry, i) => (
                            <div key={entry.name} className="flex items-center text-sm">
                                <span
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: PIE_COLORS[i] }}
                                />
                                <span className="text-slate-600 font-medium">{entry.name}</span>
                                <span className="text-slate-400 ml-1.5">({entry.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Charts Row 2 ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top Products - Bar Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Package className="w-4.5 h-4.5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Top Products</h3>
                            <p className="text-sm text-slate-500">Most requested product interests</p>
                        </div>
                    </div>

                    <div className="h-[280px]">
                        {topProducts.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={topProducts}
                                    layout="vertical"
                                    margin={{ left: 0, right: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <YAxis
                                        dataKey="product"
                                        type="category"
                                        width={120}
                                        tick={{ fontSize: 12, fill: '#475569' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: '#fff',
                                            fontSize: '12px',
                                        }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="#6366f1"
                                        radius={[0, 8, 8, 0]}
                                        barSize={24}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                No product data yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Sales Performance Table */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-4.5 h-4.5 text-violet-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Sales Performance</h3>
                            <p className="text-sm text-slate-500">Per team member breakdown</p>
                        </div>
                    </div>

                    {salesPerformance.length > 0 ? (
                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold">Name</th>
                                        <th className="text-center px-4 py-3 font-semibold">Leads</th>
                                        <th className="text-center px-4 py-3 font-semibold">Closed</th>
                                        <th className="text-right px-4 py-3 font-semibold">Conv.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {salesPerformance.map((user) => (
                                        <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{user.name}</p>
                                                        <p className="text-xs text-slate-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                                                {user.totalLeads}
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-semibold text-emerald-600">
                                                {user.closedLeads}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${user.conversionRate >= 50
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : user.conversionRate >= 20
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {user.conversionRate}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm">
                            No sales data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
