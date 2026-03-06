'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { format } from 'date-fns';
import { ArrowLeft, Building2, Mail, Phone, CalendarDays, ExternalLink, MessageCircle, FileText, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminFactoryDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [factory, setFactory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFactory = async (token: string) => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin/factories/${params.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch factory details');

                const json = await res.json();
                setFactory(json.data);
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
                fetchFactory(token);
            }
        });

        return () => unsubscribe();
    }, [params.id, toast]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!factory) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <h2 className="text-xl font-semibold">Factory not found</h2>
                <Button onClick={() => router.back()} variant="outline">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-200">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{factory.factoryName}</h1>
                    <p className="text-sm text-slate-500">Factory ID: {factory.id}</p>
                </div>
                <Badge
                    variant={factory.isActive ? 'default' : 'destructive'}
                    className={`ml-auto px-3 py-1 ${factory.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-sm' : ''}`}
                >
                    {factory.isActive ? 'Active' : 'Inactive'}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <Building2 size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-500 text-xs">Owner Name</span>
                                <span className="font-medium">{factory.ownerName}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                <Mail size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-500 text-xs">Email</span>
                                <span className="font-medium">{factory.email}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Phone size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-500 text-xs">Phone</span>
                                <span className="font-medium">{factory.phone}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <MessageCircle size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-500 text-xs">WhatsApp Business</span>
                                <span className="font-medium">{factory.whatsappNumber || 'Not connected'}</span>
                                {factory.isWhatsappConnected && (
                                    <Badge variant="outline" className="mt-1 bg-emerald-50 text-emerald-600 border-emerald-200 w-fit text-[10px]">Connected</Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700 pt-2 border-t border-slate-100">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <CalendarDays size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-500 text-xs">Joined</span>
                                <span className="font-medium">{format(new Date(factory.createdAt), 'PPP')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Subscription & Usage</CardTitle>
                        <CardDescription>Current plan details and platform usage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Users
                                </span>
                                <span className="text-2xl font-bold text-slate-900">{factory.users?.length || 0}</span>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" /> Leads
                                </span>
                                <span className="text-2xl font-bold text-slate-900">{factory._count?.leads || 0}</span>
                            </div>
                        </div>

                        <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-2">Recent Subscriptions</h3>
                        <div className="space-y-3">
                            {factory.subscriptions && factory.subscriptions.length > 0 ? (
                                factory.subscriptions.slice(0, 3).map((sub: any) => (
                                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm text-slate-900">{sub.planName}</span>
                                            <span className="text-xs text-slate-500">
                                                {sub.currentPeriodStart ? format(new Date(sub.currentPeriodStart), 'MMM d, yyyy') : 'N/A'} -
                                                {sub.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy') : 'N/A'}
                                            </span>
                                        </div>
                                        <Badge
                                            variant={sub.status === 'ACTIVE' ? 'default' : 'secondary'}
                                            className={sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : ''}
                                        >
                                            {sub.status}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 rounded-lg">No subscription history</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
