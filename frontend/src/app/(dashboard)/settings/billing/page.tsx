"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Subscription {
    planName: string;
    status: string;
    currentPeriodEnd: string;
}

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
}

export default function BillingPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);

    useEffect(() => {
        // Fetch billing data
        const fetchBillingData = async () => {
            try {
                const response = await fetch(`\${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/subscription', {
                    headers: { 'Authorization': `Bearer ${document.cookie}` } // Placeholder
                });
                const data = await response.json();

                if (data.success) {
                    setSubscription(data.data.subscription);
                    setPayments(data.data.payments || []);
                }
            } catch (error) {
                console.error("Failed to load billing", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBillingData();
    }, []);

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: 'plan_XXXX', planName: 'Pro' })
            });
            const data = await res.json();

            if (data.success) {
                toast({ title: "Subscription Started", description: "You are now on the Pro plan." });
                setSubscription(data.data.subscription);
            } else {
                toast({ title: "Error", description: data.error?.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to create subscription", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel your subscription?")) return;

        setIsLoading(true);
        try {
            const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/cancel', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                toast({ title: "Subscription Cancelled", description: "Your subscription has been cancelled." });
                if (subscription) {
                    setSubscription({ ...subscription, status: 'CANCELLED' });
                }
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to cancel subscription", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Billing & Subscription</h1>
                <p className="text-slate-500 mt-2">Manage your software plan and view payment history.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2">
                    {/* Current Plan Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Plan</CardTitle>
                            <CardDescription>
                                {subscription?.status === 'ACTIVE'
                                    ? 'You are currently on an active premium plan.'
                                    : 'You do not have an active subscription.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                                <div>
                                    <p className="font-semibold text-slate-900">{subscription?.planName || 'Free Tier'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {subscription?.status === 'ACTIVE' ? (
                                            <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</span>
                                        ) : (
                                            <span className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3 mr-1" /> {subscription?.status || 'Inactive'}</span>
                                        )}
                                    </div>
                                </div>
                                {subscription?.status === 'ACTIVE' && subscription.currentPeriodEnd && (
                                    <div className="text-right text-sm text-slate-500">
                                        Renews on<br />
                                        <span className="font-medium text-slate-900">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-3 justify-end border-t pt-6">
                            {subscription?.status === 'ACTIVE' ? (
                                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleCancel}>Cancel Subscription</Button>
                            ) : (
                                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSubscribe}>Upgrade to Pro</Button>
                            )}
                        </CardFooter>
                    </Card>

                    {/* Payment History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>Recent transactions for your account.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {payments.length === 0 ? (
                                <div className="py-8 text-center text-slate-500 border border-dashed rounded-lg">
                                    No payment history found.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {payments.map(payment => (
                                        <div key={payment.id} className="flex items-center justify-between p-3 border-b last:border-0">
                                            <div>
                                                <p className="font-medium text-slate-900">{payment.amount / 100} {payment.currency}</p>
                                                <p className="text-xs text-slate-500">{new Date(payment.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${payment.status === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                                                {payment.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
