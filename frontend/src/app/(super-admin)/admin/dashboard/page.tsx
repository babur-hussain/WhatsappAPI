'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, IndianRupee, TrendingUp, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface Stats {
    totalFactories: number;
    activeFactories: number;
    totalLeads: number;
    totalRevenue: number;
    monthlyRevenue: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async (user: FirebaseUser) => {
            try {
                const token = await user.getIdToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://loomiflow-backend-production-db59.up.railway.app'}/api/v1/admin/stats`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch platform stats');
                }

                const json = await res.json();
                setStats(json.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchStats(user);
            }
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-red-500">
                <AlertCircle size={48} />
                <h2 className="text-xl font-semibold">Failed to load statistics</h2>
                <p className="text-slate-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Overview</h1>
                <p className="text-slate-500">Monitor LoomiFlow's key performance metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Factories</CardTitle>
                        <Building2 className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalFactories || 0}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Active Factories</CardTitle>
                        <Building2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeFactories || 0}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Monthly Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.monthlyRevenue?.toLocaleString() || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Placeholder for Recent Activity matching requirements */}
            <Card className="mt-8 shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle>Recent Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-500">More detailed chart and recent specific activity feeds can go here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
