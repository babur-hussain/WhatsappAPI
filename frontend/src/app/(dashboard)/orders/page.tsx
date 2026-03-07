"use client";

import React, { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Search,
    RefreshCw,
    Filter,
    Calendar,
    Phone,
    Banknote,
    TrendingUp,
    MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Order {
    id: string;
    customerPhone: string;
    customerName: string | null;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    currency: string;
    orderStatus: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
    source: 'DASHBOARD' | 'N8N' | 'API';
    createdAt: string;
}

interface Analytics {
    totalOrders: number;
    totalRevenue: number;
    ordersThisMonth: number;
    averageOrderValue: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const API_BASE = 'https://loomiflow-backend-production-db59.up.railway.app/api/v1/orders';
const HEADERS = {
    'Authorization': 'Bearer test',
    'Content-Type': 'application/json',
};

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    SHIPPED: 'bg-indigo-100 text-indigo-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const SOURCE_COLORS: Record<string, string> = {
    DASHBOARD: 'bg-slate-100 text-slate-700',
    N8N: 'bg-pink-100 text-pink-700',
    API: 'bg-purple-100 text-purple-700',
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [phoneSearch, setPhoneSearch] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch analytics
            const anRes = await fetch(`${API_BASE}/revenue`, { headers: HEADERS });
            if (anRes.ok) {
                const anData = await anRes.json();
                setAnalytics(anData.data);
            }

            // Fetch orders
            const query = new URLSearchParams();
            if (statusFilter) query.append('orderStatus', statusFilter);
            if (phoneSearch) query.append('customerPhone', phoneSearch);

            const ordRes = await fetch(`${API_BASE}?${query.toString()}`, { headers: HEADERS });
            if (ordRes.ok) {
                const ordData = await ordRes.json();
                setOrders(ordData.data.orders || []);
            }
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter, phoneSearch]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch(`${API_BASE}/${orderId}/status`, {
                method: 'PATCH',
                headers: HEADERS,
                body: JSON.stringify({ orderStatus: newStatus }),
            });
            if (res.ok) {
                fetchData(); // Refresh list and analytics
            }
        } catch (e) {
            console.error('Failed to update status', e);
        }
    };

    const StatusDropdown = ({ order }: { order: Order }) => {
        return (
            <select
                value={order.orderStatus}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border-none cursor-pointer outline-none ${STATUS_COLORS[order.orderStatus]}`}
            >
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
            </select>
        );
    };

    return (
        <div className="p-8 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50 relative space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
                    <ShoppingCart className="w-8 h-8 mr-3 text-indigo-600" />
                    Orders
                </h1>
                <p className="text-slate-500 mt-1">
                    Manage your purchases, update statuses, and track revenue seamlessly.
                </p>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center text-slate-500 mb-2">
                        <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
                        <span className="font-semibold text-sm">Total Revenue</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        ₹{analytics?.totalRevenue?.toLocaleString() || 0}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center text-slate-500 mb-2">
                        <ShoppingCart className="w-4 h-4 mr-2 text-indigo-500" />
                        <span className="font-semibold text-sm">Total Orders</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        {analytics?.totalOrders?.toLocaleString() || 0}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center text-slate-500 mb-2">
                        <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                        <span className="font-semibold text-sm">Orders This Month</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        {analytics?.ordersThisMonth?.toLocaleString() || 0}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center text-slate-500 mb-2">
                        <Banknote className="w-4 h-4 mr-2 text-indigo-500" />
                        <span className="font-semibold text-sm">Avg. Order Value</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        ₹{Math.round(analytics?.averageOrderValue || 0).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by phone number..."
                        value={phoneSearch}
                        onChange={(e) => setPhoneSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                </div>
                <div className="w-full sm:w-64">
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition appearance-none cursor-pointer bg-white"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex py-32 items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No Orders Found</h3>
                        <p className="text-slate-500">Try adjusting your filters or wait for new orders.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Source</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{order.customerName || 'Unknown'}</div>
                                            <div className="text-slate-500 flex items-center mt-1">
                                                <Phone className="w-3 h-3 mr-1" />
                                                {order.customerPhone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 line-clamp-1">{order.productName}</div>
                                            <div className="text-slate-500">Qty: {order.quantity}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            {order.currency === 'INR' ? '₹' : order.currency}{order.totalAmount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusDropdown order={order} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${SOURCE_COLORS[order.source]}`}>
                                                {order.source}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                            {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
