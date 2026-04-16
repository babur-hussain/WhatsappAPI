"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    UserCheck,
    MessageCircle,
    TrendingUp,
    Wallet,
    ShoppingCart,
    Megaphone,
    ArrowUpRight,
    RefreshCw,
    Users,
    Zap,
    BarChart3,
    Phone,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardStats {
    totalLeads: number;
    newLeads: number;
    contactedLeads: number;
    closedLeads: number;
    totalConversations: number;
    avgResponseTime: number | null;
    leadsToday: number;
    conversionRate: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://whatsappapi.lfvs.in';
const getHeaders = () => {
    const token = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/)?.[1] || '' : '';
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const headers = getHeaders();

            const [analyticsRes, walletRes] = await Promise.allSettled([
                fetch(`${API_BASE}/api/v1/analytics/dashboard`, { headers }),
                fetch(`${API_BASE}/api/v1/wallet`, { headers }),
            ]);

            if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
                const data = await analyticsRes.value.json();
                setStats(data.data);
            }

            if (walletRes.status === 'fulfilled' && walletRes.value.ok) {
                const data = await walletRes.value.json();
                setWalletBalance(data.data?.balance ?? null);
            }
        } catch (e) {
            console.log('Failed to fetch dashboard data', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    const statCards = [
        { label: 'Total Leads', value: stats?.totalLeads ?? 0, icon: UserCheck, color: 'from-indigo-500 to-purple-600', href: '/leads' },
        { label: 'New Leads', value: stats?.newLeads ?? 0, icon: Zap, color: 'from-emerald-500 to-teal-600', href: '/leads' },
        { label: 'Conversion Rate', value: `${stats?.conversionRate?.toFixed(1) ?? 0}%`, icon: TrendingUp, color: 'from-amber-500 to-orange-600', href: '/analytics' },
        { label: 'Wallet Balance', value: `₹${walletBalance?.toLocaleString() ?? 0}`, icon: Wallet, color: 'from-blue-500 to-cyan-600', href: '/wallet' },
    ];

    const quickActions = [
        { label: 'View Leads', desc: 'Manage incoming customer leads', href: '/leads', icon: UserCheck, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Conversations', desc: 'Chat with your customers', href: '/conversations', icon: MessageCircle, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'New Broadcast', desc: 'Send bulk WhatsApp messages', href: '/broadcasts', icon: Megaphone, color: 'bg-violet-50 text-violet-600' },
        { label: 'Orders', desc: 'Track and manage purchases', href: '/orders', icon: ShoppingCart, color: 'bg-amber-50 text-amber-600' },
        { label: 'Analytics', desc: 'View reports and insights', href: '/analytics', icon: BarChart3, color: 'bg-blue-50 text-blue-600' },
        { label: 'Contacts', desc: 'Manage your contact database', href: '/contacts', icon: Users, color: 'bg-pink-50 text-pink-600' },
    ];

    const leadBreakdown = [
        { label: 'New', value: stats?.newLeads ?? 0, color: 'bg-emerald-500' },
        { label: 'Contacted', value: stats?.contactedLeads ?? 0, color: 'bg-amber-500' },
        { label: 'Closed', value: stats?.closedLeads ?? 0, color: 'bg-indigo-500' },
    ];
    const totalForBar = (stats?.newLeads ?? 0) + (stats?.contactedLeads ?? 0) + (stats?.closedLeads ?? 0) || 1;

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50 space-y-6 md:space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-1">
                    Welcome back! Here's an overview of your business.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {statCards.map(card => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.label}
                            href={card.href}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 hover:shadow-md transition group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-slate-900">{card.value}</p>
                            <p className="text-sm text-slate-500 mt-1 font-medium">{card.label}</p>
                        </Link>
                    );
                })}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Lead Pipeline */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                        Lead Pipeline
                    </h3>
                    <div className="space-y-4">
                        {leadBreakdown.map(item => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-slate-700">{item.label}</span>
                                    <span className="font-bold text-slate-900">{item.value}</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${(item.value / totalForBar) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {stats?.avgResponseTime !== null && stats?.avgResponseTime !== undefined && (
                        <div className="mt-6 pt-5 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-sm text-slate-500">
                                    <Phone className="w-4 h-4 mr-2" />
                                    Avg Response Time
                                </div>
                                <span className="text-sm font-bold text-slate-900">
                                    {stats.avgResponseTime < 60
                                        ? `${stats.avgResponseTime}s`
                                        : stats.avgResponseTime < 3600
                                            ? `${Math.round(stats.avgResponseTime / 60)}m`
                                            : `${(stats.avgResponseTime / 3600).toFixed(1)}h`}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-2">
                    <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {quickActions.map(action => {
                            const Icon = action.icon;
                            return (
                                <Link
                                    key={action.label}
                                    href={action.href}
                                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-slate-300 transition group"
                                >
                                    <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center mb-3`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-sm">{action.label}</h4>
                                    <p className="text-xs text-slate-500 mt-1">{action.desc}</p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
