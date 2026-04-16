"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Wallet,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    IndianRupee,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle2,
    XCircle,
    Zap,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ──────────────────────────────────────────────────────────────────

interface WalletData {
    id: string;
    factoryId: string;
    balance: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}

interface WalletTransaction {
    id: string;
    walletId: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    balanceAfter: number;
    description: string;
    referenceId: string | null;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const API_BASE = 'https://whatsappapi.lfvs.in/api/v1/wallet';
const getHeaders = () => {
    const token = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/)?.[1] || '' : '';
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000];

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    SUCCESS: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
    FAILED: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
};

// ─── Razorpay Type ──────────────────────────────────────────────────────────

declare global {
    interface Window {
        Razorpay: any;
    }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function WalletPage() {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(false);
    const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
    const [rechargeAmount, setRechargeAmount] = useState<number>(500);
    const [customAmount, setCustomAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [page, setPage] = useState(1);

    // ─── Computed Stats ─────────────────────────────────────────────────────

    const totalCredited = transactions
        .filter(t => t.type === 'CREDIT' && t.status === 'SUCCESS')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalDebited = transactions
        .filter(t => t.type === 'DEBIT' && t.status === 'SUCCESS')
        .reduce((sum, t) => sum + t.amount, 0);

    // ─── Data Fetching ──────────────────────────────────────────────────────

    const fetchWallet = useCallback(async () => {
        try {
            const res = await fetch(API_BASE, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setWallet(data.data);
            }
        } catch (e) {
            console.log('Failed to fetch wallet', e);
        }
    }, []);

    const fetchTransactions = useCallback(async (p: number = 1) => {
        setTxLoading(true);
        try {
            const res = await fetch(`${API_BASE}/transactions?page=${p}&limit=10`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.data.transactions || []);
                setPagination(data.data.pagination || null);
            }
        } catch (e) {
            console.log('Failed to fetch transactions', e);
        } finally {
            setTxLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchWallet(), fetchTransactions(1)]);
            setLoading(false);
        };
        init();
    }, [fetchWallet, fetchTransactions]);

    useEffect(() => {
        if (page > 1) fetchTransactions(page);
    }, [page, fetchTransactions]);

    // ─── Razorpay Script Loader ─────────────────────────────────────────────

    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) return resolve(true);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // ─── Recharge Flow ──────────────────────────────────────────────────────

    const handleRecharge = async () => {
        const amount = customAmount ? parseFloat(customAmount) : rechargeAmount;
        if (!amount || amount <= 0) return;

        setIsProcessing(true);

        try {
            // 1. Load Razorpay SDK
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                alert('Failed to load payment gateway. Please try again.');
                setIsProcessing(false);
                return;
            }

            // 2. Create Razorpay Order
            const orderRes = await fetch(`${API_BASE}/recharge`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ amount }),
            });

            if (!orderRes.ok) {
                const err = await orderRes.json();
                alert(err.error?.message || 'Failed to create recharge order');
                setIsProcessing(false);
                return;
            }

            const orderData = await orderRes.json();
            const { orderId, keyId } = orderData.data;

            // 3. Open Razorpay Checkout
            const options = {
                key: keyId,
                amount: Math.round(amount * 100),
                currency: 'INR',
                name: 'LoomiFlow',
                description: 'Wallet Recharge',
                order_id: orderId,
                handler: async (response: any) => {
                    // 4. Verify Payment
                    try {
                        const verifyRes = await fetch(`${API_BASE}/verify-recharge`, {
                            method: 'POST',
                            headers: getHeaders(),
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                amount,
                            }),
                        });

                        if (verifyRes.ok) {
                            // Refresh data
                            await Promise.all([fetchWallet(), fetchTransactions(1)]);
                            setPage(1);
                            setRechargeModalOpen(false);
                            setCustomAmount('');
                        } else {
                            const err = await verifyRes.json();
                            alert(err.error?.message || 'Payment verification failed');
                        }
                    } catch (e) {
                        alert('Payment verification failed. Please contact support.');
                    }
                    setIsProcessing(false);
                },
                modal: {
                    ondismiss: () => setIsProcessing(false),
                },
                prefill: {},
                theme: {
                    color: '#4f46e5',
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (e) {
            console.log('Recharge failed', e);
            alert('Something went wrong. Please try again.');
            setIsProcessing(false);
        }
    };

    // ─── Loading State ──────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-slate-500 font-medium">Loading wallet...</span>
                </div>
            </div>
        );
    }

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50 relative space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
                        <Wallet className="w-8 h-8 mr-3 text-indigo-600" />
                        Wallet
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Manage your balance, recharge, and track all transactions.
                    </p>
                </div>
                <button
                    onClick={() => setRechargeModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5" />
                    Recharge Wallet
                </button>
            </div>

            {/* Balance & Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Main Balance Card */}
                <div className="md:col-span-1 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-indigo-200">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-indigo-200 mb-3">
                            <IndianRupee className="w-4 h-4" />
                            <span className="text-sm font-semibold uppercase tracking-wider">Available Balance</span>
                        </div>
                        <div className="text-4xl md:text-5xl font-bold tracking-tight mb-1">
                            ₹{(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-indigo-200 text-sm mt-2">
                            {wallet?.currency || 'INR'} • Updated {wallet?.updatedAt ? format(new Date(wallet.updatedAt), 'MMM d, h:mm a') : 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Total Recharged */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-semibold text-sm">Total Recharged</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        ₹{totalCredited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                        <ArrowDownLeft className="w-3 h-3" />
                        All time credits
                    </div>
                </div>

                {/* Total Spent */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                            <TrendingDown className="w-4 h-4 text-rose-600" />
                        </div>
                        <span className="font-semibold text-sm">Total Spent</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        ₹{totalDebited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-rose-600 font-medium mt-2 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        All time debits
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {pagination?.total || 0} total transactions
                        </p>
                    </div>
                    <button
                        onClick={() => { setPage(1); fetchTransactions(1); }}
                        className="text-slate-400 hover:text-indigo-600 transition p-2 rounded-lg hover:bg-slate-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${txLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {txLoading && transactions.length === 0 ? (
                    <div className="flex py-24 items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No Transactions Yet</h3>
                        <p className="text-slate-500">Recharge your wallet to get started.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {transactions.map((tx) => {
                                const cfg = STATUS_CONFIG[tx.status];
                                const StatusIcon = cfg.icon;
                                return (
                                    <div key={tx.id} className="p-4 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'CREDIT' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                            {tx.type === 'CREDIT'
                                                ? <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                                                : <ArrowUpRight className="w-5 h-5 text-rose-600" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-slate-900 text-sm truncate">{tx.description}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{format(new Date(tx.createdAt), 'MMM d, h:mm a')}</div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className={`font-bold text-sm ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                            </div>
                                            <div className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md mt-0.5 ${cfg.bg} ${cfg.text}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {tx.status}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-right">Balance After</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {transactions.map((tx) => {
                                        const cfg = STATUS_CONFIG[tx.status];
                                        const StatusIcon = cfg.icon;
                                        return (
                                            <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                        {tx.type === 'CREDIT'
                                                            ? <ArrowDownLeft className="w-3.5 h-3.5" />
                                                            : <ArrowUpRight className="w-3.5 h-3.5" />
                                                        }
                                                        {tx.type}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900">{tx.description}</div>
                                                    {tx.referenceId && (
                                                        <div className="text-xs text-slate-400 mt-0.5 font-mono">{tx.referenceId}</div>
                                                    )}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-600 font-medium">
                                                    ₹{tx.balanceAfter.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.text}`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                                    {format(new Date(tx.createdAt), 'MMM d, h:mm a')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="text-sm text-slate-500">
                                    Page {pagination.page} of {pagination.totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                        disabled={page === pagination.totalPages}
                                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ─── Recharge Modal ─────────────────────────────────────────────── */}
            {rechargeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => !isProcessing && setRechargeModalOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Recharge Wallet</h3>
                                <p className="text-sm text-slate-500 mt-0.5">Add funds to your wallet balance</p>
                            </div>
                            <button
                                onClick={() => !isProcessing && setRechargeModalOpen(false)}
                                className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-6 space-y-6">
                            {/* Current Balance */}
                            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                                <span className="text-sm text-slate-500 font-medium">Current Balance</span>
                                <span className="text-lg font-bold text-slate-900">
                                    ₹{(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Preset Amounts */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-3 block">Quick Select</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {PRESET_AMOUNTS.map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => { setRechargeAmount(amt); setCustomAmount(''); }}
                                            className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                                                rechargeAmount === amt && !customAmount
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                            }`}
                                        >
                                            ₹{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Amount */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-2 block">Custom Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        placeholder="Enter amount"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        min={1}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-lg font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Selected Amount Preview */}
                            <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
                                <span className="text-sm text-indigo-600 font-medium">Amount to Add</span>
                                <span className="text-2xl font-bold text-indigo-700">
                                    ₹{(customAmount ? parseFloat(customAmount) || 0 : rechargeAmount).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => !isProcessing && setRechargeModalOpen(false)}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-white transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRecharge}
                                disabled={isProcessing || (customAmount ? parseFloat(customAmount) <= 0 : rechargeAmount <= 0)}
                                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        Pay & Recharge
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
