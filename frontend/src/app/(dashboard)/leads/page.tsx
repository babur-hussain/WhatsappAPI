"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, ChevronRight, X, User as UserIcon } from 'lucide-react';
import { socket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

interface Lead {
    id: string;
    customerPhone: string;
    customerName: string | null;
    productInterest: string | null;
    quantity: number | null;
    status: 'NEW' | 'CONTACTED' | 'CLOSED';
    lastMessage: string | null;
    createdAt: string;
}

interface LeadStats {
    total: number;
    newLeads: number;
    contacted: number;
    closed: number;
}

interface Message {
    id: string;
    sender: 'CUSTOMER' | 'BOT' | 'ADMIN';
    content: string;
    timestamp: string;
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stats, setStats] = useState<LeadStats>({ total: 0, newLeads: 0, contacted: 0, closed: 0 });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);

    // Detail Panel State
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [leadDetail, setLeadDetail] = useState<{ lead: Lead, messages: Message[] } | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const { toast } = useToast();

    // Auth mock
    const factoryId = 'mock-factory-id';
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [orderForm, setOrderForm] = useState({ productName: '', quantity: 1, unitPrice: 0, notes: '' });
    const [orderFormSaving, setOrderFormSaving] = useState(false);

    const apiUrl = 'https://whatsappapi.lfvs.in/api/v1/leads';
    const headers = {
        'Authorization': 'Bearer test',
        'x-factory-id': factoryId,
        'Content-Type': 'application/json'
    };

    useEffect(() => {
        fetchStats();
        fetchLeads();

        // Socket.IO Setup
        socket.connect();

        const handleNewLead = (newLeadData: any) => {
            // Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio play failed (browser policy)', e));

            toast({
                title: "New Lead Alert!",
                description: `Incoming lead from +${newLeadData.customerPhone}`,
                duration: 5000,
            });

            // Optimistically update
            fetchStats();
            // Option 1: fetch leads again to ensure correct sorting/pagination
            if (page === 1) {
                fetchLeads();
            }
        };

        socket.on('new_lead', handleNewLead);

        return () => {
            socket.off('new_lead', handleNewLead);
            socket.disconnect();
        };
    }, [page, statusFilter, search]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter })
            });

            const res = await fetch(`${apiUrl}?${query}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setLeads(data.leads);
                setTotalPages(data.totalPages);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${apiUrl}/stats`, { headers });
            if (res.ok) setStats(await res.json());
        } catch (e) { }
    };

    const handleLeadClick = async (lead: Lead) => {
        setSelectedLead(lead);
        setDetailLoading(true);
        try {
            const res = await fetch(`${apiUrl}/${lead.id}`, { headers });
            if (res.ok) setLeadDetail(await res.json());
        } catch (e) { } finally {
            setDetailLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedLead) return;
        try {
            const res = await fetch(`${apiUrl}/${selectedLead.id}/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                // Refresh everything smoothly
                fetchLeads();
                fetchStats();
                // Update local detail state
                if (leadDetail) {
                    setLeadDetail({
                        ...leadDetail,
                        lead: { ...leadDetail.lead, status: newStatus as 'NEW' | 'CONTACTED' | 'CLOSED' }
                    });
                }
            }
        } catch (e) { }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead) return;
        setOrderFormSaving(true);
        try {
            const res = await fetch(`${apiUrl.replace('/leads', '/orders')}/from-lead/${selectedLead.id}`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(orderForm)
            });
            if (res.ok) {
                toast({ title: 'Success', description: 'Order created successfully' });
                setIsCreatingOrder(false);
                setOrderForm({ productName: '', quantity: 1, unitPrice: 0, notes: '' });
                fetchLeads();
                fetchStats();
                setSelectedLead(null);
            } else {
                toast({ title: 'Error', description: 'Failed to create order', variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
        } finally {
            setOrderFormSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-100 text-blue-700';
            case 'CONTACTED': return 'bg-amber-100 text-amber-700';
            case 'CLOSED': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50/50">
            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedLead ? 'pr-[400px]' : ''}`}>
                <div className="p-8 pb-4 h-full overflow-y-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Lead Intelligence</h1>
                        <p className="text-slate-500 mt-2">Track, manage, and convert your WhatsApp pipeline.</p>
                    </div>

                    {/* Stats Header */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">Total Leads</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm font-medium text-blue-600">New</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.newLeads}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm font-medium text-amber-600">Contacted</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.contacted}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm font-medium text-emerald-600">Closed</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.closed}</h3>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search phone or name..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <select
                                className="py-2 pl-3 pr-8 border border-slate-300 bg-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="NEW">New</option>
                                <option value="CONTACTED">Contacted</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 relative min-h-[400px]">
                        {loading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <div className="animate-spin w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full" />
                            </div>
                        )}
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Last Message</th>
                                    <th className="px-6 py-4">Interest</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leads.map(lead => (
                                    <tr
                                        key={lead.id}
                                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedLead?.id === lead.id ? 'bg-indigo-50/50' : ''}`}
                                        onClick={() => handleLeadClick(lead)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{lead.customerName || 'Unknown Name'}</div>
                                            <div className="text-slate-500 text-xs mt-0.5">+{lead.customerPhone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px] truncate text-slate-600">
                                            {lead.lastMessage || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {lead.productInterest || 'N/A'} {lead.quantity ? `(x${lead.quantity})` : ''}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ChevronRight className="w-4 h-4 text-slate-400 inline-block" />
                                        </td>
                                    </tr>
                                ))}
                                {leads.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No leads found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-slate-500">
                            Page {page} of {totalPages || 1}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                            >
                                Previous
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slide-over Detail Panel */}
            <div className={`fixed inset-y-0 right-0 w-[400px] bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 ease-in-out z-20 flex flex-col ${selectedLead ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedLead && (
                    <>
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-semibold text-slate-900">Lead Details</h2>
                            <div className="flex items-center space-x-2">
                                {selectedLead.status !== 'CLOSED' && (
                                    <button
                                        onClick={() => setIsCreatingOrder(true)}
                                        className="px-3 py-1.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
                                    >
                                        Convert to Order
                                    </button>
                                )}
                                <button onClick={() => setSelectedLead(null)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-8 flex items-start space-x-4">
                                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{selectedLead.customerName || 'Unknown Customer'}</h3>
                                    <p className="text-slate-500 font-mono text-sm mt-1">+{selectedLead.customerPhone}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium text-slate-500 mb-2 block">Pipeline Status</label>
                                    <select
                                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        value={leadDetail?.lead.status || selectedLead.status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                    >
                                        <option value="NEW">New Lead</option>
                                        <option value="CONTACTED">Contacted</option>
                                        <option value="CLOSED">Closed/Won</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-6">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Interest</span>
                                        <span className="text-sm text-slate-900 font-medium">{leadDetail?.lead.productInterest || 'Not specified'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Quantity</span>
                                        <span className="text-sm text-slate-900 font-medium">{leadDetail?.lead.quantity || 'Not specified'}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
                                        <MessageSquare className="w-4 h-4 mr-2 text-slate-400" />
                                        Conversation History
                                    </h4>

                                    <div className="space-y-4">
                                        {detailLoading ? (
                                            <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full" /></div>
                                        ) : (
                                            leadDetail?.messages?.map(msg => (
                                                <div key={msg.id} className={`flex flex-col ${msg.sender === 'CUSTOMER' ? 'items-start' : 'items-end'}`}>
                                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === 'CUSTOMER' ? 'bg-slate-100 text-slate-800 rounded-tl-sm' : 'bg-indigo-600 text-white rounded-tr-sm'}`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {msg.sender === 'BOT' ? ' • Auto-reply' : ''}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Create Order Modal */}
            {isCreatingOrder && selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <form onSubmit={handleCreateOrder} className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Create Order</h2>
                            <button type="button" onClick={() => setIsCreatingOrder(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-6 py-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Product Name</label>
                                <input required type="text" value={orderForm.productName} onChange={e => setOrderForm({ ...orderForm, productName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Silk Saree" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">Quantity</label>
                                    <input required type="number" min="1" value={orderForm.quantity} onChange={e => setOrderForm({ ...orderForm, quantity: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">Unit Price</label>
                                    <input required type="number" min="0" step="0.01" value={orderForm.unitPrice} onChange={e => setOrderForm({ ...orderForm, unitPrice: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Notes (Optional)</label>
                                <textarea rows={3} value={orderForm.notes} onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Order details from WhatsApp..."></textarea>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-500">Total Amount</span>
                                <span className="text-lg font-bold text-indigo-700">₹{(orderForm.quantity * orderForm.unitPrice).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50/50 rounded-b-2xl">
                            <button type="button" onClick={() => setIsCreatingOrder(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
                            <button type="submit" disabled={orderFormSaving} className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                                {orderFormSaving ? 'Processing...' : 'Confirm Order'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
