"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Megaphone,
    Search,
    RefreshCw,
    X,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    Send,
    Upload,
    FileSpreadsheet,
    List,
    AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Broadcast {
    id: string;
    title: string;
    message: string;
    targetType: string;
    status: 'DRAFT' | 'SENDING' | 'COMPLETED';
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    createdAt: string;
}

interface ContactListItem {
    id: string;
    name: string;
    contactCount: number;
    _count?: { members: number };
}

// ─── Constants ───────────────────────────────────────────────────────────────
const API_BASE = 'https://whatsappapi.lfvs.in/api/v1/broadcasts';
const CONTACTS_API = 'https://whatsappapi.lfvs.in/api/v1/contacts';
const HEADERS = {
    'Authorization': 'Bearer test',
    'Content-Type': 'application/json',
};

type BroadcastMode = 'leads' | 'contacts' | 'file';

const TARGET_TYPES = [
    { value: 'ALL_LEADS', label: 'All Past Leads', desc: 'Send to everyone in your leads database' },
    { value: 'NEW_LEADS', label: 'New Leads Only', desc: 'Send only to leads with NEW status' },
    { value: 'CONTACTED_LEADS', label: 'Contacted Leads Only', desc: 'Send to leads already contacted' },
];

export default function BroadcastsPage() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formSaving, setFormSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState('ALL_LEADS');
    const [mediaUrl, setMediaUrl] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Enhanced: broadcast mode
    const [broadcastMode, setBroadcastMode] = useState<BroadcastMode>('leads');

    // Contact list selection
    const [contactLists, setContactLists] = useState<ContactListItem[]>([]);
    const [selectedListId, setSelectedListId] = useState('');

    // File upload
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    const fetchBroadcasts = async () => {
        try {
            const res = await fetch(API_BASE, { headers: HEADERS });
            if (res.ok) {
                const data = await res.json();
                setBroadcasts(data.data || []);
            }
        } catch (e) {
            console.error('Failed to fetch broadcasts', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchContactLists = async () => {
        try {
            const res = await fetch(`${CONTACTS_API}/lists`, { headers: HEADERS });
            if (res.ok) {
                const data = await res.json();
                setContactLists(data.data || []);
            }
        } catch { }
    };

    useEffect(() => {
        fetchBroadcasts();
        fetchContactLists();

        const interval = setInterval(() => {
            setBroadcasts(current => {
                if (current.some(b => b.status === 'SENDING')) {
                    fetchBroadcasts();
                }
                return current;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setFormSaving(true);

        try {
            let res;

            if (broadcastMode === 'leads') {
                res = await fetch(API_BASE, {
                    method: 'POST',
                    headers: HEADERS,
                    body: JSON.stringify({
                        title,
                        message,
                        targetType,
                        mediaUrl: mediaUrl || undefined,
                    }),
                });
            } else if (broadcastMode === 'contacts') {
                if (!selectedListId) {
                    setErrorMsg('Please select a contact list');
                    setFormSaving(false);
                    return;
                }
                res = await fetch(`${API_BASE}/from-contacts`, {
                    method: 'POST',
                    headers: HEADERS,
                    body: JSON.stringify({
                        title,
                        message,
                        contactListId: selectedListId,
                        mediaUrl: mediaUrl || undefined,
                    }),
                });
            } else {
                // file mode
                if (!uploadFile) {
                    setErrorMsg('Please select a CSV or Excel file');
                    setFormSaving(false);
                    return;
                }
                const formData = new FormData();
                formData.append('file', uploadFile);
                formData.append('title', title);
                formData.append('message', message);
                if (mediaUrl) formData.append('mediaUrl', mediaUrl);

                res = await fetch(`${API_BASE}/from-file`, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer test' },
                    body: formData,
                });
            }

            const data = await res.json();

            if (res.ok) {
                setIsCreating(false);
                setTitle(''); setMessage(''); setMediaUrl('');
                setSelectedListId(''); setUploadFile(null);
                setBroadcastMode('leads');
                fetchBroadcasts();
            } else {
                setErrorMsg(data.message || 'Failed to create broadcast.');
            }
        } catch (e) {
            setErrorMsg('An unexpected error occurred.');
        } finally {
            setFormSaving(false);
        }
    };

    const targetTypeLabel = (type: string) => {
        switch (type) {
            case 'CONTACT_LIST': return 'Contact List';
            case 'CSV_UPLOAD': return 'CSV/Excel';
            default: return TARGET_TYPES.find(t => t.value === type)?.label || type;
        }
    };

    return (
        <div className="p-8 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
                        <Megaphone className="w-8 h-8 mr-3 text-indigo-600" />
                        Broadcasts
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Send bulk WhatsApp messages to your leads, contact lists, or uploaded files.
                    </p>
                </div>
                <button
                    onClick={() => { setIsCreating(true); setErrorMsg(''); }}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Broadcast</span>
                </button>
            </div>

            {/* Content Array */}
            {loading ? (
                <div className="flex py-20 items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            ) : broadcasts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Megaphone className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Broadcasts Yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">
                        You haven't sent any broadcast messages. Reach out to your audience in bulk with ease.
                    </p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-6 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
                    >
                        Create First Broadcast
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {broadcasts.map((b) => (
                        <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition hover:shadow-md">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="text-lg font-bold text-slate-900">{b.title}</h3>
                                    {b.status === 'SENDING' && (
                                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center">
                                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> SENDING
                                        </span>
                                    )}
                                    {b.status === 'COMPLETED' && (
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> COMPLETED
                                        </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                        {targetTypeLabel(b.targetType)}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm line-clamp-1 mb-3">{b.message}</p>
                                <div className="flex items-center space-x-6 text-sm text-slate-500">
                                    <span className="flex items-center"><Users className="w-4 h-4 mr-1.5" /> {b.totalRecipients} Recipients</span>
                                    <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> {format(new Date(b.createdAt), 'MMM d, yyyy h:mm a')}</span>
                                </div>
                            </div>

                            <div className="w-full md:w-64 bg-slate-50 rounded-xl p-4 border border-slate-100 shrink-0">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</div>
                                    <div className="text-sm font-bold text-slate-900">
                                        {Math.round(((b.sentCount + b.failedCount) / (b.totalRecipients || 1)) * 100)}%
                                    </div>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full mb-3 overflow-hidden flex">
                                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(b.sentCount / (b.totalRecipients || 1)) * 100}%` }}></div>
                                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${(b.failedCount / (b.totalRecipients || 1)) * 100}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-emerald-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> {b.sentCount} Sent</span>
                                    {b.failedCount > 0 && <span className="text-red-500 flex items-center"><XCircle className="w-3 h-3 mr-1" /> {b.failedCount} Failed</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Broadcast Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <form onSubmit={handleCreate} className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                <Send className="w-5 h-5 mr-2 text-indigo-600" />
                                Create New Broadcast
                            </h2>
                            <button type="button" onClick={() => setIsCreating(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 py-6 overflow-y-auto space-y-6">
                            {errorMsg && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Campaign Title</label>
                                <input
                                    required
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Summer Collection Launch"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </div>

                            {/* ─── Broadcast Source Mode ─── */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Recipient Source</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {([
                                        { key: 'leads', label: 'From Leads', desc: 'Target leads by status', icon: Users },
                                        { key: 'contacts', label: 'Contact List', desc: 'Select a saved list', icon: List },
                                        { key: 'file', label: 'Upload File', desc: 'CSV or Excel file', icon: FileSpreadsheet },
                                    ] as const).map(mode => (
                                        <button
                                            key={mode.key}
                                            type="button"
                                            onClick={() => setBroadcastMode(mode.key)}
                                            className={`p-4 rounded-xl border text-left transition ${broadcastMode === mode.key
                                                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                        >
                                            <mode.icon className={`w-5 h-5 mb-2 ${broadcastMode === mode.key ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            <h4 className={`font-bold text-sm mb-0.5 ${broadcastMode === mode.key ? 'text-indigo-900' : 'text-slate-900'}`}>
                                                {mode.label}
                                            </h4>
                                            <p className={`text-xs ${broadcastMode === mode.key ? 'text-indigo-700' : 'text-slate-500'}`}>
                                                {mode.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ─── Leads Mode: Target Audience ─── */}
                            {broadcastMode === 'leads' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">Target Audience</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {TARGET_TYPES.map(tt => (
                                            <button
                                                key={tt.value}
                                                type="button"
                                                onClick={() => setTargetType(tt.value)}
                                                className={`p-4 rounded-xl border text-left transition ${targetType === tt.value
                                                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                            >
                                                <h4 className={`font-bold text-sm mb-1 ${targetType === tt.value ? 'text-indigo-900' : 'text-slate-900'}`}>
                                                    {tt.label}
                                                </h4>
                                                <p className={`text-xs ${targetType === tt.value ? 'text-indigo-700' : 'text-slate-500'}`}>
                                                    {tt.desc}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ─── Contacts Mode: Select List ─── */}
                            {broadcastMode === 'contacts' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">Select Contact List</label>
                                    {contactLists.length === 0 ? (
                                        <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-sm border border-amber-200">
                                            No contact lists found. Go to Contacts → Contact Lists to create one first.
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {contactLists.map(list => (
                                                <button
                                                    key={list.id}
                                                    type="button"
                                                    onClick={() => setSelectedListId(list.id)}
                                                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${selectedListId === list.id
                                                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <List className={`w-4 h-4 ${selectedListId === list.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                                                        <span className={`font-semibold text-sm ${selectedListId === list.id ? 'text-indigo-900' : 'text-slate-900'}`}>{list.name}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-500">{list._count?.members ?? list.contactCount} contacts</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─── File Mode: Upload ─── */}
                            {broadcastMode === 'file' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">Upload CSV / Excel File</label>
                                    <div
                                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${uploadFile ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                                            }`}
                                        onClick={() => document.getElementById('broadcast-file-input')?.click()}
                                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                                        onDrop={e => {
                                            e.preventDefault(); e.stopPropagation();
                                            const file = e.dataTransfer.files[0];
                                            if (file) setUploadFile(file);
                                        }}
                                    >
                                        <input
                                            id="broadcast-file-input"
                                            type="file"
                                            accept=".csv,.xlsx,.xls"
                                            className="hidden"
                                            onChange={e => e.target.files?.[0] && setUploadFile(e.target.files[0])}
                                        />
                                        {uploadFile ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
                                                <div className="text-left">
                                                    <p className="font-semibold text-sm text-slate-900">{uploadFile.name}</p>
                                                    <p className="text-xs text-slate-500">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                                <button type="button" onClick={e => { e.stopPropagation(); setUploadFile(null); }}
                                                    className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                <p className="font-semibold text-sm text-slate-700">Drop file or click to browse</p>
                                                <p className="text-xs text-slate-400 mt-1">CSV, Excel · Must have a &quot;phone&quot; column</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Type your broadcast message here... Use {{name}}, {{phone}}, {{company}} as placeholders"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-slate-500">
                                        Placeholders: {'{{name}}'}, {'{{phone}}'}, {'{{email}}'}, {'{{company}}'}, or any CSV column name
                                    </p>
                                    <p className="text-xs font-semibold text-slate-400">{message.length}/1000</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Media URL (Optional)</label>
                                <input
                                    type="url"
                                    value={mediaUrl}
                                    onChange={e => setMediaUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </div>

                            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex items-start space-x-3">
                                <div className="mt-0.5"><Clock className="w-5 h-5 text-indigo-500" /></div>
                                <div>
                                    <h5 className="font-semibold text-sm text-indigo-900">Safety Limits Enforced</h5>
                                    <p className="text-xs text-indigo-700 mt-1">
                                        Max 5,000 recipients per broadcast. Speed is automatically limited to roughly 20 messages per minute to prevent WhatsApp account bans.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end space-x-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={formSaving || !title || !message}
                                className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center"
                            >
                                {formSaving ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Broadcast
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
