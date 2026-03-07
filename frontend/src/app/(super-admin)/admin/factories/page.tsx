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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Eye, Search } from 'lucide-react';
import Link from 'next/link';

interface Factory {
    id: string;
    factoryName: string;
    ownerName: string;
    email: string;
    phone: string;
    isActive: boolean;
    subscriptionStatus: string;
    leadsCount: number;
    usersCount: number;
    createdAt: string;
}

export default function AdminFactoriesPage() {
    const [factories, setFactories] = useState<Factory[]>([]);
    const [loading, setLoading] = useState(true);
    const [userToken, setUserToken] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchFactories = async (token: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://loomiflow-backend-production-db59.up.railway.app'}/api/v1/admin/factories`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to fetch factories');

            const json = await res.json();
            setFactories(json.data.factories);
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (user) {
                const token = await user.getIdToken();
                setUserToken(token);
                fetchFactories(token);
            }
        });

        return () => unsubscribe();
    }, []);

    const toggleFactoryStatus = async (id: string, currentStatus: boolean) => {
        if (!userToken) return;

        // Optimistic UI update
        setFactories(factories.map(f => f.id === id ? { ...f, isActive: !currentStatus } : f));

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://loomiflow-backend-production-db59.up.railway.app'}/api/v1/admin/factories/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userToken}`
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            if (!res.ok) {
                throw new Error('Failed to update status');
            }

            toast({
                title: 'Success',
                description: `Factory status updated to ${!currentStatus ? 'Active' : 'Inactive'}`,
            });
        } catch (error: any) {
            // Revert on failure
            setFactories(factories.map(f => f.id === id ? { ...f, isActive: currentStatus } : f));
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Factories</h1>
                    <p className="text-sm text-slate-500">View and control all registered tenant factories.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50 text-slate-600">
                            <TableHead className="font-semibold px-6 py-4">Factory</TableHead>
                            <TableHead className="font-semibold px-6 py-4">Contact</TableHead>
                            <TableHead className="font-semibold px-6 py-4">Subscription</TableHead>
                            <TableHead className="font-semibold px-6 py-4 text-center">Leads</TableHead>
                            <TableHead className="font-semibold px-6 py-4">Joined</TableHead>
                            <TableHead className="font-semibold px-6 py-4 text-center">Access</TableHead>
                            <TableHead className="font-semibold px-6 py-4 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {factories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                                    No factories found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            factories.map((factory) => (
                                <TableRow key={factory.id} className="group">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{factory.factoryName}</span>
                                            <span className="text-sm text-slate-500">{factory.ownerName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col text-sm">
                                            <span className="text-slate-700">{factory.email}</span>
                                            <span className="text-slate-500">{factory.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <Badge
                                            variant={factory.subscriptionStatus === 'ACTIVE' ? 'default' : 'secondary'}
                                            className={factory.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none' : 'bg-slate-100 text-slate-600 shadow-none'}
                                        >
                                            {factory.subscriptionStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-center">
                                        <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                                            {factory.leadsCount}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                        {format(new Date(factory.createdAt), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-center">
                                        <Switch
                                            checked={factory.isActive}
                                            onCheckedChange={() => toggleFactoryStatus(factory.id, factory.isActive)}
                                        />
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" asChild className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                            <Link href={`/admin/factories/${factory.id}`}>
                                                <Eye className="w-4 h-4 mr-2" />
                                                View
                                            </Link>
                                        </Button>
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
