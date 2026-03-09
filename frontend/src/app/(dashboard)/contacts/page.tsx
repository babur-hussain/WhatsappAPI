"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Upload,
    Search,
    RefreshCw,
    X,
    Users,
    Trash2,
    Edit3,
    FileSpreadsheet,
    List,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    AlertCircle,
    FolderPlus,
    ExternalLink,
    Phone,
    Mail,
    Building2,
    Tag,
    Clock,
    MoreVertical,
    Filter,
    Download,
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Contact {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    company: string | null;
    tags: string[];
    customFields: Record<string, string>;
    source: 'MANUAL' | 'CSV_IMPORT' | 'EXCEL_IMPORT';
    createdAt: string;
}

interface ContactList {
    id: string;
    name: string;
    description: string | null;
    contactCount: number;
    createdAt: string;
    _count?: { members: number };
}

interface ImportJob {
    id: string;
    fileName: string;
    totalRows: number;
    importedCount: number;
    skippedCount: number;
    failedCount: number;
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    createdAt: string;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = 'https://whatsappapi.lfvs.in/api/v1/contacts';
const getHeaders = () => ({
    'Authorization': `Bearer ${document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || ''}`,
    'Content-Type': 'application/json',
});

type ViewMode = 'contacts' | 'lists' | 'imports';

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ContactsPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('contacts');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactLists, setContactLists] = useState<ContactList[]>([]);
    const [importHistory, setImportHistory] = useState<ImportJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [totalContacts, setTotalContacts] = useState(0);

    // Modals
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showListModal, setShowListModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    // Selection
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

    // Import state
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportJob | null>(null);

    // Add contact form
    const [formPhone, setFormPhone] = useState('');
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formCompany, setFormCompany] = useState('');
    const [formSaving, setFormSaving] = useState(false);

    // List form
    const [listName, setListName] = useState('');
    const [listDesc, setListDesc] = useState('');

    const [errorMsg, setErrorMsg] = useState('');

    // ─── Fetch Functions ─────────────────────────────────────────────────────

    const fetchContacts = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '50',
            });
            if (searchQuery) params.set('search', searchQuery);

            const res = await fetch(`${API_BASE}?${params}`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setContacts(data.data?.contacts || []);
                setPagination(data.data?.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
            }
        } catch (e) {
            console.error('Failed to fetch contacts', e);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    const fetchContactCount = async () => {
        try {
            const res = await fetch(`${API_BASE}/count`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setTotalContacts(data.data?.count || 0);
            }
        } catch { }
    };

    const fetchContactLists = async () => {
        try {
            const res = await fetch(`${API_BASE}/lists`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setContactLists(data.data || []);
            }
        } catch { }
    };

    const fetchImportHistory = async () => {
        try {
            const res = await fetch(`${API_BASE}/import/history`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setImportHistory(data.data || []);
            }
        } catch { }
    };

    useEffect(() => {
        fetchContacts();
        fetchContactCount();
        fetchContactLists();
        fetchImportHistory();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => fetchContacts(), 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, fetchContacts]);

    // ─── Actions ─────────────────────────────────────────────────────────────

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormSaving(true);
        setErrorMsg('');

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    phone: formPhone,
                    name: formName || undefined,
                    email: formEmail || undefined,
                    company: formCompany || undefined,
                }),
            });

            if (res.ok) {
                setShowAddModal(false);
                setFormPhone(''); setFormName(''); setFormEmail(''); setFormCompany('');
                fetchContacts();
                fetchContactCount();
            } else {
                const data = await res.json();
                setErrorMsg(data.message || 'Failed to add contact');
            }
        } catch {
            setErrorMsg('An error occurred');
        } finally {
            setFormSaving(false);
        }
    };

    const handleEditContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingContact) return;
        setFormSaving(true);
        setErrorMsg('');

        try {
            const res = await fetch(`${API_BASE}/${editingContact.id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({
                    phone: formPhone,
                    name: formName || undefined,
                    email: formEmail || undefined,
                    company: formCompany || undefined,
                }),
            });

            if (res.ok) {
                setShowEditModal(false);
                setEditingContact(null);
                fetchContacts();
            } else {
                const data = await res.json();
                setErrorMsg(data.message || 'Failed to update contact');
            }
        } catch {
            setErrorMsg('An error occurred');
        } finally {
            setFormSaving(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedContacts.size === 0) return;
        if (!confirm(`Delete ${selectedContacts.size} contact(s)? This cannot be undone.`)) return;

        try {
            const res = await fetch(`${API_BASE}/bulk-delete`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ contactIds: Array.from(selectedContacts) }),
            });

            if (res.ok) {
                setSelectedContacts(new Set());
                fetchContacts();
                fetchContactCount();
            }
        } catch { }
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        setImportResult(null);
        setErrorMsg('');

        try {
            const formData = new FormData();
            formData.append('file', importFile);

            const res = await fetch(`${API_BASE}/import`, {
                method: 'POST',
                headers: { 'Authorization': getHeaders().Authorization },
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setImportResult(data.data);
                fetchContacts();
                fetchContactCount();
                fetchImportHistory();
            } else {
                setErrorMsg(data.message || 'Import failed');
            }
        } catch {
            setErrorMsg('Import failed');
        } finally {
            setImporting(false);
        }
    };

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormSaving(true);
        setErrorMsg('');

        try {
            const contactIds = selectedContacts.size > 0 ? Array.from(selectedContacts) : undefined;
            const res = await fetch(`${API_BASE}/lists`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    name: listName,
                    description: listDesc || undefined,
                    contactIds,
                }),
            });

            if (res.ok) {
                setShowListModal(false);
                setListName(''); setListDesc('');
                setSelectedContacts(new Set());
                fetchContactLists();
            } else {
                const data = await res.json();
                setErrorMsg(data.message || 'Failed to create list');
            }
        } catch {
            setErrorMsg('An error occurred');
        } finally {
            setFormSaving(false);
        }
    };

    const handleDeleteList = async (listId: string) => {
        if (!confirm('Delete this contact list?')) return;
        try {
            await fetch(`${API_BASE}/lists/${listId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            fetchContactLists();
        } catch { }
    };

    const openEdit = (contact: Contact) => {
        setEditingContact(contact);
        setFormPhone(contact.phone);
        setFormName(contact.name || '');
        setFormEmail(contact.email || '');
        setFormCompany(contact.company || '');
        setShowEditModal(true);
    };

    const toggleSelect = (id: string) => {
        setSelectedContacts(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedContacts.size === contacts.length) {
            setSelectedContacts(new Set());
        } else {
            setSelectedContacts(new Set(contacts.map(c => c.id)));
        }
    };

    const sourceLabel = (source: string) => {
        switch (source) {
            case 'CSV_IMPORT': return 'CSV';
            case 'EXCEL_IMPORT': return 'Excel';
            default: return 'Manual';
        }
    };

    const sourceBadgeColor = (source: string) => {
        switch (source) {
            case 'CSV_IMPORT': return 'bg-blue-100 text-blue-700';
            case 'EXCEL_IMPORT': return 'bg-green-100 text-green-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="p-8 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
                        <Users className="w-8 h-8 mr-3 text-indigo-600" />
                        Contacts
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {totalContacts.toLocaleString()} contacts · {contactLists.length} lists
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition"
                    >
                        <Upload className="w-4 h-4" /> Import
                    </button>
                    <button
                        onClick={() => setShowListModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition"
                    >
                        <FolderPlus className="w-4 h-4" /> New List
                    </button>
                    <button
                        onClick={() => { setShowAddModal(true); setErrorMsg(''); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                    >
                        <Plus className="w-5 h-5" /> Add Contact
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 mb-6 w-fit">
                {([
                    { key: 'contacts', label: 'All Contacts', icon: Users },
                    { key: 'lists', label: 'Contact Lists', icon: List },
                    { key: 'imports', label: 'Import History', icon: FileSpreadsheet },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setViewMode(tab.key); if (tab.key === 'lists') fetchContactLists(); if (tab.key === 'imports') fetchImportHistory(); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === tab.key
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── Contacts Tab ─────────────────────────────────────────────────── */}
            {viewMode === 'contacts' && (
                <>
                    {/* Search & Actions Bar */}
                    <div className="flex items-center justify-between mb-4 gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, or company..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                            />
                        </div>

                        {selectedContacts.size > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-500 font-medium">{selectedContacts.size} selected</span>
                                <button
                                    onClick={() => setShowListModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition"
                                >
                                    <FolderPlus className="w-3.5 h-3.5" /> Add to List
                                </button>
                                <button
                                    onClick={handleDeleteSelected}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex py-20 items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Contacts Yet</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mb-6">
                                Import your contacts from CSV or Excel, or add them manually.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setShowImportModal(true)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition flex items-center gap-2">
                                    <Upload className="w-4 h-4" /> Import File
                                </button>
                                <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Add Manually
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedContacts.size === contacts.length && contacts.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Added</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {contacts.map(contact => (
                                        <tr key={contact.id} className={`transition hover:bg-slate-50/50 ${selectedContacts.has(contact.id) ? 'bg-indigo-50/30' : ''}`}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedContacts.has(contact.id)}
                                                    onChange={() => toggleSelect(contact.id)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                        {(contact.name || contact.phone)?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{contact.name || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 font-mono">{contact.phone}</td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{contact.email || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{contact.company || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sourceBadgeColor(contact.source)}`}>
                                                    {sourceLabel(contact.source)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-400">
                                                {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => openEdit(contact)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                                    <p className="text-sm text-slate-500">
                                        Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={pagination.page <= 1}
                                            onClick={() => fetchContacts(pagination.page - 1)}
                                            className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            disabled={pagination.page >= pagination.totalPages}
                                            onClick={() => fetchContacts(pagination.page + 1)}
                                            className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ─── Contact Lists Tab ────────────────────────────────────────────── */}
            {viewMode === 'lists' && (
                <div className="space-y-4">
                    {contactLists.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <List className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Contact Lists</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mb-6">
                                Create lists to organize your contacts and use them for targeted broadcasts.
                            </p>
                            <button
                                onClick={() => setShowListModal(true)}
                                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                            >
                                Create First List
                            </button>
                        </div>
                    ) : (
                        contactLists.map(list => (
                            <div key={list.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-between gap-6 hover:shadow-md transition">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                                        <List className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{list.name}</h3>
                                        {list.description && <p className="text-sm text-slate-500 mt-0.5">{list.description}</p>}
                                        <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {list._count?.members ?? list.contactCount} contacts</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(list.createdAt), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteList(list.id)}
                                    className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ─── Import History Tab ───────────────────────────────────────────── */}
            {viewMode === 'imports' && (
                <div className="space-y-4">
                    {importHistory.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileSpreadsheet className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Imports Yet</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mb-6">
                                Import contacts from CSV or Excel files to get started.
                            </p>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                            >
                                Import Contacts
                            </button>
                        </div>
                    ) : (
                        importHistory.map(job => (
                            <div key={job.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                                        <h3 className="font-bold text-slate-900">{job.fileName}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                            job.status === 'PROCESSING' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <span className="text-sm text-slate-400">
                                        {format(new Date(job.createdAt), 'MMM d, yyyy h:mm a')}
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-4 text-center">
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-xl font-bold text-slate-900">{job.totalRows}</p>
                                        <p className="text-xs text-slate-500 font-medium">Total Rows</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3">
                                        <p className="text-xl font-bold text-emerald-700">{job.importedCount}</p>
                                        <p className="text-xs text-emerald-600 font-medium">Imported</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-3">
                                        <p className="text-xl font-bold text-amber-700">{job.skippedCount}</p>
                                        <p className="text-xs text-amber-600 font-medium">Skipped</p>
                                    </div>
                                    <div className="bg-red-50 rounded-xl p-3">
                                        <p className="text-xl font-bold text-red-700">{job.failedCount}</p>
                                        <p className="text-xs text-red-600 font-medium">Failed</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ─── Import Modal ─────────────────────────────────────────────────── */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-indigo-600" /> Import Contacts
                            </h2>
                            <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); setErrorMsg(''); }}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-6 py-6 space-y-4">
                            {errorMsg && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                                </div>
                            )}

                            {importResult ? (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Import Complete</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-emerald-700">{importResult.importedCount}</p>
                                            <p className="text-xs text-emerald-600">Imported</p>
                                        </div>
                                        <div className="bg-amber-50 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-amber-700">{importResult.skippedCount}</p>
                                            <p className="text-xs text-amber-600">Skipped</p>
                                        </div>
                                        <div className="bg-red-50 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-red-700">{importResult.failedCount}</p>
                                            <p className="text-xs text-red-600">Failed</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }}
                                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div
                                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer ${importFile ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                                            }`}
                                        onClick={() => document.getElementById('import-file-input')?.click()}
                                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                                        onDrop={e => {
                                            e.preventDefault(); e.stopPropagation();
                                            const file = e.dataTransfer.files[0];
                                            if (file) setImportFile(file);
                                        }}
                                    >
                                        <input
                                            id="import-file-input"
                                            type="file"
                                            accept=".csv,.xlsx,.xls"
                                            className="hidden"
                                            onChange={e => e.target.files?.[0] && setImportFile(e.target.files[0])}
                                        />
                                        {importFile ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                                                <div className="text-left">
                                                    <p className="font-semibold text-slate-900">{importFile.name}</p>
                                                    <p className="text-xs text-slate-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                                <button
                                                    onClick={e => { e.stopPropagation(); setImportFile(null); }}
                                                    className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                                                <p className="font-semibold text-slate-700">Drop your file here or click to browse</p>
                                                <p className="text-sm text-slate-400 mt-1">Supports CSV, Excel (.xlsx, .xls) · Max 10MB · Max 10,000 rows</p>
                                            </>
                                        )}
                                    </div>

                                    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                                        <h5 className="font-semibold text-sm text-indigo-900 mb-2">Column Mapping</h5>
                                        <p className="text-xs text-indigo-700">
                                            Your file should include a <strong>phone</strong> column (required). We auto-detect columns named:
                                            phone, name, email, company. All other columns are saved as custom fields.
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button onClick={() => { setShowImportModal(false); setImportFile(null); }}
                                            className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition">
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            disabled={!importFile || importing}
                                            className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {importing ? (
                                                <><RefreshCw className="w-4 h-4 animate-spin" /> Importing...</>
                                            ) : (
                                                <><Upload className="w-4 h-4" /> Import Contacts</>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Add Contact Modal ─────────────────────────────────────────────── */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <form onSubmit={handleAddContact} className="bg-white rounded-2xl w-full max-w-md shadow-xl">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-600" /> Add Contact
                            </h2>
                            <button type="button" onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-6 py-6 space-y-4">
                            {errorMsg && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{errorMsg}</div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Phone Number *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input required type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)}
                                        placeholder="+91 98765 43210" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Name</label>
                                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                                    placeholder="John Doe" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                                        placeholder="john@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Company</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="text" value={formCompany} onChange={e => setFormCompany(e.target.value)}
                                        placeholder="Acme Inc." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                            <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
                            <button type="submit" disabled={formSaving || !formPhone} className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
                                {formSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Add Contact</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ─── Edit Contact Modal ────────────────────────────────────────────── */}
            {showEditModal && editingContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <form onSubmit={handleEditContact} className="bg-white rounded-2xl w-full max-w-md shadow-xl">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-indigo-600" /> Edit Contact
                            </h2>
                            <button type="button" onClick={() => { setShowEditModal(false); setEditingContact(null); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-6 py-6 space-y-4">
                            {errorMsg && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{errorMsg}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Phone Number *</label>
                                <input required type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Name</label>
                                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Email</label>
                                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Company</label>
                                <input type="text" value={formCompany} onChange={e => setFormCompany(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                            <button type="button" onClick={() => { setShowEditModal(false); setEditingContact(null); }} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
                            <button type="submit" disabled={formSaving || !formPhone} className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
                                {formSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ─── Create List Modal ──────────────────────────────────────────────── */}
            {showListModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <form onSubmit={handleCreateList} className="bg-white rounded-2xl w-full max-w-md shadow-xl">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <FolderPlus className="w-5 h-5 text-indigo-600" /> New Contact List
                            </h2>
                            <button type="button" onClick={() => setShowListModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-6 py-6 space-y-4">
                            {errorMsg && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{errorMsg}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-1.5">List Name *</label>
                                <input required type="text" value={listName} onChange={e => setListName(e.target.value)}
                                    placeholder="e.g. VIP Customers" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Description</label>
                                <textarea value={listDesc} onChange={e => setListDesc(e.target.value)} rows={3}
                                    placeholder="Optional description..." className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
                            </div>
                            {selectedContacts.size > 0 && (
                                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                                    <p className="text-sm text-indigo-800 font-medium">
                                        <Users className="w-4 h-4 inline mr-1.5" />
                                        {selectedContacts.size} selected contact(s) will be added to this list
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                            <button type="button" onClick={() => setShowListModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
                            <button type="submit" disabled={formSaving || !listName} className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
                                {formSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : <><FolderPlus className="w-4 h-4" /> Create List</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
