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

interface Payment {
    id: string;
    factory: {
        factoryName: string;
        email: string;
    };
    amount: number;
    currency: string;
    status: string;
    razorpayPaymentId: string | null;
    createdAt: string;
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchPayments = async (token: string) => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin/payments`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch payments');

                const json = await res.json();
                setPayments(json.data.payments);
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
                fetchPayments(token);
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
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments</h1>
                <p className="text-sm text-slate-500">Monitor all transactions and payments processing through the platform.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="font-semibold px-6 py-4">Factory</TableHead>
                            <TableHead className="font-semibold px-6 py-4">Amount</TableHead>
                            <TableHead className="font-semibold px-6 py-4">Status</TableHead>
                            <TableHead className="font-semibold px-6 py-4">Gateway ID</TableHead>
                            <TableHead className="font-semibold px-6 py-4 text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                    No payments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((payment) => (
                                <TableRow key={payment.id} className="hover:bg-slate-50/50">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{payment.factory.factoryName}</span>
                                            <span className="text-xs text-slate-500">{payment.factory.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <span className="font-semibold text-slate-900">
                                            {payment.currency === 'INR' ? '₹' : payment.currency} {(payment.amount / 100).toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <Badge
                                            variant={payment.status === 'SUCCESS' ? 'default' : payment.status === 'FAILED' ? 'destructive' : 'secondary'}
                                            className={payment.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none' : payment.status === 'FAILED' ? 'bg-red-100 text-red-700 hover:bg-red-200 shadow-none' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-none'}
                                        >
                                            {payment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm font-mono text-slate-500">
                                        {payment.razorpayPaymentId || '-'}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-slate-500 text-right whitespace-nowrap">
                                        {format(new Date(payment.createdAt), 'MMM d, yyyy h:mm a')}
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
