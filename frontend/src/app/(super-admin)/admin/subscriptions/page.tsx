'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
    id: string;
    factory: {
        factoryName: string;
        email: string;
    };
    planName: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    createdAt: string;
}

export default function AdminSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSubscriptions = async (token: string) => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin/subscriptions`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch subscriptions');

                const json = await res.json();
                setSubscriptions(json.data.subscriptions);
            } catch (err: any) {
                toast({
                    title: 'Error',
                    description: err.message,
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (user) {
                const token = await user.getIdToken();
                fetchSubscriptions(token);
            }
        });

        return () => unsubscribe();
    }, [toast]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscriptions</h1>
                <p className="text-sm text-slate-500">Monitor all factory subscriptions across the platform.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="font-semibold px-6 py-4">Factory</TableHead>
                            <TableHead className="font-semibold px-6 py-4">Plan Name</TableHead>
                            <TableHead className="font-semibold px-6 py-4">Status</TableHead>
                            <TableHead className="font-semibold px-6 py-4">Period Start</TableHead>
                            <TableHead className="font-semibold px-6 py-4">Period End</TableHead>
                            <TableHead className="font-semibold px-6 py-4 text-right">Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscriptions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                    No subscriptions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            subscriptions.map((sub) => (
                                <TableRow key={sub.id} className="hover:bg-slate-50/50">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{sub.factory.factoryName}</span>
                                            <span className="text-xs text-slate-500">{sub.factory.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm font-medium text-slate-700">
                                        {sub.planName}
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <Badge
                                            variant={sub.status === 'ACTIVE' ? 'default' : 'secondary'}
                                            className={sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none' : 'bg-slate-100 text-slate-600 shadow-none'}
                                        >
                                            {sub.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-slate-600">
                                        {sub.currentPeriodStart ? format(new Date(sub.currentPeriodStart), 'MMM d, yyyy') : 'N/A'}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-slate-600">
                                        {sub.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy') : 'N/A'}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-slate-500 text-right whitespace-nowrap">
                                        {format(new Date(sub.createdAt), 'MMM d, yyyy h:mm a')}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
