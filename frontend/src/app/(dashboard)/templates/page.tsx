"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, FileText, Search, RefreshCw, X, Users, CheckCircle2, XCircle,
    Clock, Send, Trash2, Edit3, Eye, Copy, ChevronDown, ChevronRight, AlertTriangle,
    MessageSquare, Image, Video, File, Phone, ExternalLink, Zap, Layers, Tag
} from 'lucide-react';
import { META_DEFAULT_TEMPLATES, TEMPLATE_GROUPS, type MetaTemplate } from '@/lib/metaTemplateLibrary';
import { auth } from '@/lib/firebase';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Template {
    id: string;
    name: string;
    category: string;
    language: string;
    status: string;
    components: any[];
    quality_score?: any;
    rejected_reason?: string;
    isDefault?: boolean;
    group?: string;
}

type ViewMode = 'library' | 'create' | 'edit' | 'preview' | 'send' | 'bulk-send';

// Meta templates are imported from @/lib/metaTemplateLibrary

// ─── Constants ───────────────────────────────────────────────────────────────
const API = 'https://loomiflow-backend-production-db59.up.railway.app/api/v1/templates';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken(true);
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    }
    // Fallback to cookie if Firebase user not available yet
    const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/) : null;
    const cookieToken = match ? match[1] : '';
    return { 'Authorization': `Bearer ${cookieToken}`, 'Content-Type': 'application/json' };
};

const CATEGORIES = [
    { value: 'MARKETING', label: 'Marketing', desc: 'Promotions, offers, updates', icon: Zap, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { value: 'UTILITY', label: 'Utility', desc: 'Order updates, alerts', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { value: 'AUTHENTICATION', label: 'Authentication', desc: 'OTP, verification codes', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
];

const LANGUAGES = [
    { code: 'en', label: 'English' }, { code: 'en_US', label: 'English (US)' },
    { code: 'hi', label: 'Hindi' }, { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' }, { code: 'ar', label: 'Arabic' },
    { code: 'pt_BR', label: 'Portuguese (BR)' }, { code: 'id', label: 'Indonesian' },
];

const TARGETS = [
    { value: 'ALL_LEADS', label: 'All Leads', desc: 'Send to all leads' },
    { value: 'NEW_LEADS', label: 'New Leads', desc: 'Only new leads' },
    { value: 'CONTACTED_LEADS', label: 'Contacted', desc: 'Already contacted' },
];

const statusBadge = (s: string) => {
    const map: Record<string, string> = {
        APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
        REJECTED: 'bg-red-100 text-red-700 border-red-200',
        PAUSED: 'bg-slate-100 text-slate-600 border-slate-200',
        DISABLED: 'bg-slate-100 text-slate-500 border-slate-200',
    };
    return map[s] || 'bg-slate-100 text-slate-600 border-slate-200';
};

const statusIcon = (s: string) => {
    if (s === 'APPROVED') return <CheckCircle2 className="w-3 h-3 mr-1" />;
    if (s === 'PENDING') return <Clock className="w-3 h-3 mr-1 animate-pulse" />;
    if (s === 'REJECTED') return <XCircle className="w-3 h-3 mr-1" />;
    return <AlertTriangle className="w-3 h-3 mr-1" />;
};

// ─── Component Helpers ───────────────────────────────────────────────────────
function getComponentText(components: any[], type: string): string {
    const c = components?.find((x: any) => x.type === type);
    return c?.text || '';
}

function getButtons(components: any[]): any[] {
    const c = components?.find((x: any) => x.type === 'BUTTONS');
    return c?.buttons || [];
}

function getHeaderFormat(components: any[]): string {
    const c = components?.find((x: any) => x.type === 'HEADER');
    return c?.format || 'NONE';
}

// ─── WhatsApp Preview ────────────────────────────────────────────────────────
function TemplatePreview({ components, name }: { components: any[]; name?: string }) {
    const header = getComponentText(components, 'HEADER');
    const body = getComponentText(components, 'BODY');
    const footer = getComponentText(components, 'FOOTER');
    const buttons = getButtons(components);
    const headerFmt = getHeaderFormat(components);

    return (
        <div className="w-full max-w-[320px] mx-auto">
            <div className="bg-[#e5ddd5] rounded-2xl p-4 min-h-[200px]">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {headerFmt === 'IMAGE' && (
                        <div className="h-36 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                            <Image className="w-10 h-10 text-indigo-300" />
                        </div>
                    )}
                    {headerFmt === 'VIDEO' && (
                        <div className="h-36 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                            <Video className="w-10 h-10 text-blue-300" />
                        </div>
                    )}
                    {headerFmt === 'DOCUMENT' && (
                        <div className="h-20 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                            <File className="w-8 h-8 text-amber-300" />
                        </div>
                    )}
                    <div className="p-3">
                        {header && headerFmt === 'TEXT' && <p className="font-bold text-sm text-slate-900 mb-1">{header}</p>}
                        {body && <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{body}</p>}
                        {footer && <p className="text-xs text-slate-400 mt-2">{footer}</p>}
                        <p className="text-[10px] text-slate-400 text-right mt-1">12:00 PM ✓✓</p>
                    </div>
                    {buttons.length > 0 && (
                        <div className="border-t border-slate-100">
                            {buttons.map((btn: any, i: number) => (
                                <div key={i} className="text-center py-2 text-sm text-blue-500 font-medium border-b border-slate-50 last:border-0 flex items-center justify-center gap-1.5">
                                    {btn.type === 'URL' && <ExternalLink className="w-3.5 h-3.5" />}
                                    {btn.type === 'PHONE_NUMBER' && <Phone className="w-3.5 h-3.5" />}
                                    {btn.type === 'QUICK_REPLY' && <MessageSquare className="w-3.5 h-3.5" />}
                                    {btn.type === 'COPY_CODE' && <Copy className="w-3.5 h-3.5" />}
                                    {btn.text}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Modal Wrapper (defined at module scope to prevent focus loss on re-render) ─
function Modal({ children, title, icon, onClose }: { children: React.ReactNode; title: string; icon: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center">{icon}<span className="ml-2">{title}</span></h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>(META_DEFAULT_TEMPLATES as Template[]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<ViewMode>('library');
    const [searchQ, setSearchQ] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterGroup, setFilterGroup] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string>('UTILITY');
    const [selected, setSelected] = useState<Template | null>(null);
    const [showLibrary, setShowLibrary] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    // Create form state
    const [formName, setFormName] = useState('');
    const [formCategory, setFormCategory] = useState('MARKETING');
    const [formLanguage, setFormLanguage] = useState('en');
    const [formHeaderType, setFormHeaderType] = useState('NONE');
    const [formHeaderText, setFormHeaderText] = useState('');
    const [formBody, setFormBody] = useState('');
    const [formFooter, setFormFooter] = useState('');
    const [formButtons, setFormButtons] = useState<any[]>([]);

    // Send form
    const [sendPhone, setSendPhone] = useState('');
    const [bulkTarget, setBulkTarget] = useState('ALL_LEADS');
    // Send customization
    const [sendBodyVars, setSendBodyVars] = useState<Record<string, string>>({});
    const [sendHeaderVar, setSendHeaderVar] = useState('');
    const [sendHeaderMediaUrl, setSendHeaderMediaUrl] = useState('');

    const fetchTemplates = useCallback(async (showSpinner = false) => {
        if (showSpinner) setLoading(true);
        let apiTemplates: Template[] = [];
        try {
            const params = new URLSearchParams();
            if (filterCat) params.append('category', filterCat);
            if (filterStatus) params.append('status', filterStatus);
            const res = await fetch(`${API}?${params}`, {
                headers: await getAuthHeaders(),
                cache: 'no-store',
            });
            if (res.ok) {
                const data = await res.json();
                apiTemplates = (data.data?.templates || []).map((t: Template) => ({ ...t, isDefault: false }));
            }
        } catch (e) { console.error(e); }

        // Merge: API templates take priority, then add defaults not already present
        const apiNames = new Set(apiTemplates.map(t => t.name));
        const defaults = META_DEFAULT_TEMPLATES.filter(d => !apiNames.has(d.name));
        setTemplates([...apiTemplates, ...defaults]);
        setLoading(false);
    }, [filterCat, filterStatus]);

    useEffect(() => { fetchTemplates(false); }, [fetchTemplates]);

    const resetForm = () => {
        setFormName(''); setFormCategory('MARKETING'); setFormLanguage('en');
        setFormHeaderType('NONE'); setFormHeaderText(''); setFormBody('');
        setFormFooter(''); setFormButtons([]); setError(''); setSuccess('');
    };

    const buildComponents = () => {
        const comps: any[] = [];
        
        if (formHeaderType !== 'NONE') {
            const header: any = { type: 'HEADER', format: formHeaderType };
            if (formHeaderType === 'TEXT') {
                header.text = formHeaderText;
                // Extract variables like {{1}} from header text
                const matches = formHeaderText.match(/\{\{\d+\}\}/g);
                if (matches && matches.length > 0) {
                    header.example = { header_text: Array(matches.length).fill('Sample') };
                }
            } else {
                // For media headers (IMAGE/VIDEO/DOCUMENT), the backend handles
                // uploading a sample file to Meta's Resumable Upload API to get
                // a valid header_handle. We intentionally do NOT set example here.
            }
            comps.push(header);
        }
        
        if (formBody) {
            const body: any = { type: 'BODY', text: formBody };
            // Extract variables like {{1}} from body text
            const matches = formBody.match(/\{\{\d+\}\}/g);
            if (matches && matches.length > 0) {
                // Create unique variables list because Meta uses continuous indices {{1}}, {{2}}...
                // Using a set to get the maximum variable index
                let maxVar = 0;
                matches.forEach(m => {
                    const num = parseInt(m.replace(/[^0-9]/g, ''));
                    if (num > maxVar) maxVar = num;
                });
                if (maxVar > 0) {
                    body.example = { body_text: [Array(maxVar).fill('Sample')] };
                }
            }
            comps.push(body);
        }
        
        if (formFooter) comps.push({ type: 'FOOTER', text: formFooter });
        if (formButtons.length > 0) comps.push({ type: 'BUTTONS', buttons: formButtons });
        return comps;
    };

    const previewComponents = buildComponents();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setError(''); setSaving(true);
        try {
            const res = await fetch(API, {
                method: 'POST', headers: await getAuthHeaders(),
                body: JSON.stringify({ name: formName, category: formCategory, language: formLanguage, components: buildComponents() }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('Template created! It will be reviewed by Meta.');
                setTimeout(() => { setView('library'); resetForm(); fetchTemplates(); }, 1500);
            } else { setError(data.error?.message || 'Failed to create template'); }
        } catch { setError('An unexpected error occurred.'); }
        finally { setSaving(false); }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault(); if (!selected) return;
        setError(''); setSaving(true);
        try {
            const res = await fetch(`${API}/${selected.id}`, {
                method: 'PUT', headers: await getAuthHeaders(),
                body: JSON.stringify({ components: buildComponents() }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('Template updated!');
                setTimeout(() => { setView('library'); resetForm(); fetchTemplates(); }, 1500);
            } else { setError(data.error?.message || 'Failed to update'); }
        } catch { setError('An unexpected error occurred.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`Delete template "${name}"? This cannot be undone and the name cannot be reused for 30 days.`)) return;
        try {
            const res = await fetch(`${API}/name/${encodeURIComponent(name)}`, { method: 'DELETE', headers: await getAuthHeaders() });
            if (res.ok) { setSuccess('Template deleted'); fetchTemplates(); }
            else { const d = await res.json(); setError(d.error?.message || 'Failed to delete'); }
        } catch { setError('Failed to delete'); }
    };

    // Helper: extract variable placeholders like {{1}}, {{2}} from text
    const extractVars = (text: string): string[] => {
        const matches = text.match(/\{\{\d+\}\}/g);
        return matches ? Array.from(new Set(matches)).sort() : [];
    };

    // Helper: get send components array for WhatsApp API
    const buildSendComponents = () => {
        if (!selected) return [];
        const comps: any[] = [];
        const headerComp = selected.components?.find((c: any) => c.type === 'HEADER');
        const bodyComp = selected.components?.find((c: any) => c.type === 'BODY');

        // Header component
        if (headerComp) {
            if (headerComp.format === 'TEXT' && headerComp.text) {
                const headerVars = extractVars(headerComp.text);
                if (headerVars.length > 0 && sendHeaderVar) {
                    comps.push({ type: 'header', parameters: [{ type: 'text', text: sendHeaderVar }] });
                }
            } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComp.format) && sendHeaderMediaUrl) {
                const mediaType = headerComp.format.toLowerCase();
                comps.push({
                    type: 'header',
                    parameters: [{ type: mediaType, [mediaType]: { link: sendHeaderMediaUrl } }],
                });
            }
        }

        // Body component
        if (bodyComp?.text) {
            const bodyVars = extractVars(bodyComp.text);
            if (bodyVars.length > 0) {
                const params = bodyVars.map((v) => ({
                    type: 'text',
                    text: sendBodyVars[v] || v,
                }));
                comps.push({ type: 'body', parameters: params });
            }
        }

        return comps;
    };

    // Helper: replace variables in text with user-provided values for preview
    const fillVars = (text: string, vars: Record<string, string>) => {
        return text.replace(/\{\{\d+\}\}/g, (match) => vars[match] || match);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault(); if (!selected) return;
        // Validate 10-digit phone number
        if (!/^\d{10}$/.test(sendPhone)) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }
        setError(''); setSaving(true);
        try {
            const components = buildSendComponents();
            // Prepend India country code
            const fullPhone = `91${sendPhone}`;

            // Build full text content for storage in conversations
            const headerComp = selected.components?.find((c: any) => c.type === 'HEADER');
            const bodyComp = selected.components?.find((c: any) => c.type === 'BODY');
            const footerComp = selected.components?.find((c: any) => c.type === 'FOOTER');
            let templateContent = '';
            if (headerComp?.format === 'TEXT' && headerComp?.text) {
                const hText = sendHeaderVar ? headerComp.text.replace(/\{\{1\}\}/, sendHeaderVar) : headerComp.text;
                templateContent += `*${hText}*\n\n`;
            }
            if (headerComp?.format && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComp.format)) {
                templateContent += `[${headerComp.format}: ${sendHeaderMediaUrl || 'attached'}]\n\n`;
            }
            if (bodyComp?.text) {
                templateContent += fillVars(bodyComp.text, sendBodyVars);
            }
            if (footerComp?.text) {
                templateContent += `\n\n${footerComp.text}`;
            }

            const body: any = { to: fullPhone, templateName: selected.name, languageCode: selected.language, templateContent: templateContent.trim() };
            if (components.length > 0) body.components = components;

            const res = await fetch(`${API}/send`, {
                method: 'POST', headers: await getAuthHeaders(),
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('Template sent!');
                setTimeout(() => {
                    setView('library'); setSendPhone(''); setSuccess('');
                    setSendBodyVars({}); setSendHeaderVar(''); setSendHeaderMediaUrl('');
                }, 1500);
            } else {
                const errMsg = data.error?.message || 'Send failed';
                if (selected.isDefault && errMsg.includes('template')) {
                    setError(`${errMsg}. Note: Library templates must be created in your WhatsApp Business Account first. Use "Use as Base" to create your own version.`);
                } else {
                    setError(errMsg);
                }
            }
        } catch { setError('Send failed'); }
        finally { setSaving(false); }
    };

    const handleBulkSend = async (e: React.FormEvent) => {
        e.preventDefault(); if (!selected) return;
        setError(''); setSaving(true);
        try {
            const res = await fetch(`${API}/bulk-send`, {
                method: 'POST', headers: await getAuthHeaders(),
                body: JSON.stringify({ templateName: selected.name, languageCode: selected.language, targetType: bulkTarget }),
            });
            const data = await res.json();
            if (res.ok) { setSuccess(`Bulk send started! ${data.data?.totalRecipients || 0} recipients queued.`); setTimeout(() => { setView('library'); setSuccess(''); }, 2000); }
            else { setError(data.error?.message || 'Bulk send failed'); }
        } catch { setError('Bulk send failed'); }
        finally { setSaving(false); }
    };

    const openEdit = (t: Template) => {
        setSelected(t); setView('edit');
        setFormName(t.name); setFormCategory(t.category); setFormLanguage(t.language);
        setFormHeaderType(getHeaderFormat(t.components));
        setFormHeaderText(getComponentText(t.components, 'HEADER'));
        setFormBody(getComponentText(t.components, 'BODY'));
        setFormFooter(getComponentText(t.components, 'FOOTER'));
        setFormButtons(getButtons(t.components));
        setError(''); setSuccess('');
    };

    const addButton = () => {
        if (formButtons.length >= 3) return;
        setFormButtons([...formButtons, { type: 'QUICK_REPLY', text: '' }]);
    };

    const updateButton = (i: number, field: string, val: string) => {
        const updated = [...formButtons]; updated[i] = { ...updated[i], [field]: val };
        setFormButtons(updated);
    };

    const removeButton = (i: number) => setFormButtons(formButtons.filter((_, idx) => idx !== i));

    const insertVariable = () => {
        const nextVar = (formBody.match(/\{\{\d+\}\}/g) || []).length + 1;
        setFormBody(formBody + `{{${nextVar}}}`);
    };

    const myTemplates = templates.filter(t => !t.isDefault);
    const myTemplateCount = myTemplates.length;

    const filtered = templates.filter(t => {
        // When not showing library, hide default templates
        if (!showLibrary && t.isDefault) return false;
        // When showing library, hide non-default (my) templates
        if (showLibrary && !t.isDefault) return false;
        if (searchQ && !t.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
        if (t.isDefault && filterCat && t.category !== filterCat) return false;
        if (t.isDefault && filterStatus && t.status !== filterStatus) return false;
        if (filterGroup && (t as any).group !== filterGroup) return false;
        return true;
    });

    // Compute group counts from current templates
    const groupCounts = templates.reduce((acc, t) => {
        const g = (t as any).group || 'Other';
        acc[g] = (acc[g] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const utilityGroups = TEMPLATE_GROUPS.filter(g => g.category === 'UTILITY');
    const authGroups = TEMPLATE_GROUPS.filter(g => g.category === 'AUTHENTICATION');

    // ═══ RENDER ═══════════════════════════════════════════════════════════════

    // ─── Create / Edit Form ─────────────────────────────────────────────────
    const renderForm = (isEdit: boolean) => (
        <Modal title={isEdit ? 'Edit Template' : 'Create New Template'} icon={<Edit3 className="w-5 h-5 text-indigo-600" />} onClose={() => { setView('library'); resetForm(); }}>
            <form onSubmit={isEdit ? handleUpdate : handleCreate}>
                <div className="flex flex-col lg:flex-row">
                    {/* Left: Form */}
                    <div className="flex-1 px-6 py-6 space-y-5 border-r border-slate-100">
                        {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{error}</div>}
                        {success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-200">{success}</div>}

                        {/* Name */}
                        {!isEdit && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Template Name</label>
                                <input required value={formName} onChange={e => setFormName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                    placeholder="e.g. order_confirmation" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm" />
                                <p className="text-xs text-slate-400 mt-1">Lowercase letters, numbers, underscores only</p>
                            </div>
                        )}

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Category</label>
                            <div className="grid grid-cols-3 gap-2">
                                {CATEGORIES.map(c => (
                                    <button key={c.value} type="button" onClick={() => setFormCategory(c.value)}
                                        className={`p-3 rounded-xl border text-left transition ${formCategory === c.value ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <c.icon className={`w-4 h-4 mb-1 ${formCategory === c.value ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <h4 className="font-semibold text-xs">{c.label}</h4>
                                        <p className="text-[10px] text-slate-500">{c.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Language */}
                        {!isEdit && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Language</label>
                                <select value={formLanguage} onChange={e => setFormLanguage(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Header */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Header (Optional)</label>
                            <div className="flex gap-2 mb-2">
                                {['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'].map(t => (
                                    <button key={t} type="button" onClick={() => setFormHeaderType(t)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${formHeaderType === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                        {t === 'NONE' ? 'None' : t.charAt(0) + t.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                            {formHeaderType === 'TEXT' && (
                                <input value={formHeaderText} onChange={e => setFormHeaderText(e.target.value)} placeholder="Header text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                            )}
                            {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formHeaderType) && (
                                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">Media will be uploaded when sending. Template will include a {formHeaderType.toLowerCase()} placeholder.</p>
                            )}
                        </div>

                        {/* Body */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-slate-900">Body</label>
                                <button type="button" onClick={insertVariable} className="text-xs text-indigo-600 font-medium hover:text-indigo-800 transition flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add Variable
                                </button>
                            </div>
                            <textarea required rows={4} value={formBody} onChange={e => setFormBody(e.target.value)}
                                placeholder="Hello {{1}}, your order {{2}} has been confirmed!"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm" />
                            <div className="flex justify-between mt-1">
                                <p className="text-xs text-slate-400">Use {'{{1}}'}, {'{{2}}'} etc. for variables</p>
                                <p className="text-xs text-slate-400 font-semibold">{formBody.length}/1024</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Footer (Optional)</label>
                            <input value={formFooter} onChange={e => setFormFooter(e.target.value)} placeholder="e.g. Reply STOP to unsubscribe" maxLength={60}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                        </div>

                        {/* Buttons */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-slate-900">Buttons (Optional)</label>
                                {formButtons.length < 3 && (
                                    <button type="button" onClick={addButton} className="text-xs text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Add Button
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {formButtons.map((btn, i) => (
                                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <select value={btn.type} onChange={e => updateButton(i, 'type', e.target.value)} className="px-2 py-1.5 rounded-lg border text-xs font-medium">
                                                <option value="QUICK_REPLY">Quick Reply</option>
                                                <option value="URL">URL</option>
                                                <option value="PHONE_NUMBER">Phone</option>
                                                <option value="COPY_CODE">Copy Code</option>
                                            </select>
                                            <input value={btn.text} onChange={e => updateButton(i, 'text', e.target.value)} placeholder="Button label"
                                                className="flex-1 px-3 py-1.5 rounded-lg border text-xs" />
                                            <button type="button" onClick={() => removeButton(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                        {btn.type === 'URL' && (
                                            <input value={btn.url || ''} onChange={e => updateButton(i, 'url', e.target.value)} placeholder="https://example.com"
                                                className="w-full px-3 py-1.5 rounded-lg border text-xs" />
                                        )}
                                        {btn.type === 'PHONE_NUMBER' && (
                                            <input value={btn.phone_number || ''} onChange={e => updateButton(i, 'phone_number', e.target.value)} placeholder="+919876543210"
                                                className="w-full px-3 py-1.5 rounded-lg border text-xs" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="w-full lg:w-80 p-6 bg-slate-50/50 shrink-0">
                        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center"><Eye className="w-4 h-4 mr-2" /> Live Preview</h3>
                        <TemplatePreview components={previewComponents} name={formName} />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl shrink-0">
                    <button type="button" onClick={() => { setView('library'); resetForm(); }} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
                    <button type="submit" disabled={saving || !formBody}
                        className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center transition">
                        {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />{isEdit ? 'Update' : 'Create'} Template</>}
                    </button>
                </div>
            </form>
        </Modal>
    );

    // ─── Preview Modal ───────────────────────────────────────────────────────
    const renderPreview = () => selected && (
        <Modal title={selected.name} icon={<Eye className="w-5 h-5 text-indigo-600" />} onClose={() => { setView('library'); setSelected(null); }}>
            <div className="p-6 flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border flex items-center ${statusBadge(selected.status)}`}>
                            {statusIcon(selected.status)} {selected.status}
                        </span>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">{selected.category}</span>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">{selected.language}</span>
                        {(selected as any).group && <span className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full border border-violet-200">{(selected as any).group}</span>}
                        {selected.isDefault && <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200">Meta Library</span>}
                    </div>
                    {selected.rejected_reason && (
                        <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-sm text-red-700">
                            <strong>Rejection Reason:</strong> {selected.rejected_reason}
                        </div>
                    )}
                    <div className="flex gap-2 pt-2 flex-wrap">
                        {selected.status === 'APPROVED' && (
                            <>
                                <button onClick={() => { setView('send'); }} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                                    <Send className="w-4 h-4" /> Send
                                </button>
                                <button onClick={() => { setView('bulk-send'); }} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition">
                                    <Users className="w-4 h-4" /> Bulk Send
                                </button>
                            </>
                        )}
                        {selected.isDefault ? (
                            <button onClick={() => {
                                resetForm();
                                setFormName(selected.name + '_custom');
                                setFormCategory(selected.category);
                                setFormBody(getComponentText(selected.components, 'BODY'));
                                setFormFooter(getComponentText(selected.components, 'FOOTER'));
                                setFormHeaderType(getHeaderFormat(selected.components));
                                setFormHeaderText(getComponentText(selected.components, 'HEADER'));
                                setFormButtons(getButtons(selected.components));
                                setView('create');
                            }} className="flex items-center gap-1.5 px-4 py-2 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-sm font-semibold hover:bg-violet-100 transition">
                                <Copy className="w-4 h-4" /> Use as Base
                            </button>
                        ) : (
                            <>
                                <button onClick={() => openEdit(selected)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition">
                                    <Edit3 className="w-4 h-4" /> Edit
                                </button>
                                <button onClick={() => handleDelete(selected.name)} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition">
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="w-full lg:w-80 shrink-0">
                    <TemplatePreview components={selected.components} name={selected.name} />
                </div>
            </div>
        </Modal>
    );

    // ─── Send Modal ──────────────────────────────────────────────────────────
    const renderSend = () => {
        if (!selected) return null;
        const headerComp = selected.components?.find((c: any) => c.type === 'HEADER');
        const bodyComp = selected.components?.find((c: any) => c.type === 'BODY');
        const bodyVars = bodyComp?.text ? extractVars(bodyComp.text) : [];
        const headerVars = (headerComp?.format === 'TEXT' && headerComp?.text) ? extractVars(headerComp.text) : [];
        const headerFormat = headerComp?.format || 'NONE';
        const isMediaHeader = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat);
        const hasCustomizations = bodyVars.length > 0 || headerVars.length > 0 || isMediaHeader;

        // Build a preview with variables filled in
        const previewComponents = selected.components?.map((c: any) => {
            if (c.type === 'BODY' && c.text) {
                return { ...c, text: fillVars(c.text, sendBodyVars) };
            }
            if (c.type === 'HEADER' && c.format === 'TEXT' && c.text && sendHeaderVar) {
                return { ...c, text: c.text.replace(/\{\{1\}\}/, sendHeaderVar) };
            }
            return c;
        }) || [];

        return (
            <Modal title={`Send: ${selected.name}`} icon={<Send className="w-5 h-5 text-indigo-600" />} onClose={() => { setView('library'); setSendPhone(''); setSendBodyVars({}); setSendHeaderVar(''); setSendHeaderMediaUrl(''); setError(''); setSuccess(''); }}>
                <form onSubmit={handleSend} className="p-6 space-y-5">
                    {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{error}</div>}
                    {success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-200">{success}</div>}

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Mobile Number</label>
                        <div className="flex rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 overflow-hidden">
                            <span className="flex items-center px-3 bg-slate-100 text-slate-500 text-sm font-medium border-r border-slate-300 select-none">+91</span>
                            <input
                                required
                                value={sendPhone}
                                onChange={e => setSendPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="10-digit number"
                                maxLength={10}
                                inputMode="numeric"
                                className="flex-1 px-4 py-2.5 outline-none text-sm bg-white"
                            />
                        </div>
                        {sendPhone.length > 0 && sendPhone.length < 10 && (
                            <p className="text-xs text-amber-600 mt-1">{10 - sendPhone.length} more digits needed</p>
                        )}
                    </div>

                    {/* Customization Section */}
                    {hasCustomizations && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Zap className="w-4 h-4 text-amber-500" />
                                Customize Content
                            </div>

                            {/* Header Media Upload */}
                            {isMediaHeader && (
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        {headerFormat === 'IMAGE' && <><Image className="w-4 h-4 text-indigo-500" /> Header Image URL</>}
                                        {headerFormat === 'VIDEO' && <><Video className="w-4 h-4 text-blue-500" /> Header Video URL</>}
                                        {headerFormat === 'DOCUMENT' && <><File className="w-4 h-4 text-amber-500" /> Header Document URL</>}
                                    </label>
                                    <input
                                        value={sendHeaderMediaUrl}
                                        onChange={e => setSendHeaderMediaUrl(e.target.value)}
                                        placeholder={headerFormat === 'IMAGE' ? 'https://example.com/image.jpg' : headerFormat === 'VIDEO' ? 'https://example.com/video.mp4' : 'https://example.com/document.pdf'}
                                        className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <p className="text-xs text-slate-400 mt-1.5">Publicly accessible URL to the {headerFormat.toLowerCase()} file</p>
                                </div>
                            )}

                            {/* Header Text Variable */}
                            {headerVars.length > 0 && (
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <Tag className="w-4 h-4 text-indigo-500" />
                                        Header Variable
                                    </label>
                                    <input
                                        value={sendHeaderVar}
                                        onChange={e => setSendHeaderVar(e.target.value)}
                                        placeholder={`Value for ${headerVars[0]}`}
                                        className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                </div>
                            )}

                            {/* Body Variables */}
                            {bodyVars.length > 0 && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100 space-y-3">
                                    <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <Layers className="w-4 h-4 text-amber-500" />
                                        Body Variables ({bodyVars.length})
                                    </p>
                                    {bodyVars.map((v, i) => (
                                        <div key={v}>
                                            <label className="block text-xs text-slate-500 mb-1">{v} — Variable {i + 1}</label>
                                            <input
                                                value={sendBodyVars[v] || ''}
                                                onChange={e => setSendBodyVars(prev => ({ ...prev, [v]: e.target.value }))}
                                                placeholder={`Enter value for ${v}`}
                                                className="w-full px-4 py-2.5 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-400 outline-none text-sm bg-white"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Live Preview */}
                    <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs text-slate-500 mb-3">Live Preview</p>
                        {isMediaHeader && sendHeaderMediaUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden max-w-[320px] mx-auto">
                                {headerFormat === 'IMAGE' && (
                                    <img src={sendHeaderMediaUrl} alt="Header" className="w-full h-36 object-cover bg-indigo-50" onError={e => (e.currentTarget.style.display = 'none')} />
                                )}
                                {headerFormat === 'VIDEO' && (
                                    <video src={sendHeaderMediaUrl} className="w-full h-36 object-cover bg-blue-50" controls />
                                )}
                                {headerFormat === 'DOCUMENT' && (
                                    <div className="h-20 bg-amber-50 flex items-center justify-center gap-2 text-amber-600 text-sm">
                                        <File className="w-5 h-5" /> Document attached
                                    </div>
                                )}
                            </div>
                        )}
                        <TemplatePreview components={previewComponents} />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => { setView('library'); setSendPhone(''); setSendBodyVars({}); setSendHeaderVar(''); setSendHeaderMediaUrl(''); }}
                            className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
                        <button type="submit" disabled={saving || !sendPhone}
                            className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center">
                            {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send Template</>}
                        </button>
                    </div>
                </form>
            </Modal>
        );
    };

    // ─── Bulk Send Modal ─────────────────────────────────────────────────────
    const renderBulkSend = () => selected && (
        <Modal title={`Bulk Send: ${selected.name}`} icon={<Users className="w-5 h-5 text-emerald-600" />} onClose={() => { setView('library'); setError(''); setSuccess(''); }}>
            <form onSubmit={handleBulkSend} className="p-6 space-y-5">
                {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{error}</div>}
                {success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-200">{success}</div>}
                <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Target Audience</label>
                    <div className="grid grid-cols-3 gap-3">
                        {TARGETS.map(t => (
                            <button key={t.value} type="button" onClick={() => setBulkTarget(t.value)}
                                className={`p-4 rounded-xl border text-left transition ${bulkTarget === t.value ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' : 'border-slate-200 hover:border-slate-300'}`}>
                                <h4 className={`font-bold text-sm mb-1 ${bulkTarget === t.value ? 'text-emerald-900' : 'text-slate-900'}`}>{t.label}</h4>
                                <p className={`text-xs ${bulkTarget === t.value ? 'text-emerald-700' : 'text-slate-500'}`}>{t.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <h5 className="font-semibold text-sm text-amber-900">Important</h5>
                        <p className="text-xs text-amber-700 mt-1">Messages will be sent via queue with rate limiting. Max 5,000 recipients. Only approved templates can be bulk sent.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setView('library')} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
                    <button type="submit" disabled={saving}
                        className="px-5 py-2.5 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center">
                        {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing...</> : <><Users className="w-4 h-4 mr-2" />Start Bulk Send</>}
                    </button>
                </div>
            </form>
        </Modal>
    );

    // ─── Main Library View ───────────────────────────────────────────────────
    return (
        <div className="p-8 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
                        <FileText className="w-8 h-8 mr-3 text-indigo-600" /> Message Templates
                    </h1>
                    <p className="text-slate-500 mt-1">Create, manage, and send WhatsApp message templates via Meta API.
                        <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{showLibrary ? templates.filter(t => t.isDefault).length : myTemplateCount} templates</span>
                    </p>
                </div>
                <button onClick={() => { resetForm(); setView('create'); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                    <Plus className="w-5 h-5" /> New Template
                </button>
            </div>

            {/* Alerts */}
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 flex items-center justify-between">{error}<button onClick={() => setError('')}><X className="w-4 h-4" /></button></div>}
            {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-200 flex items-center justify-between">{success}<button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button></div>}

            {/* Top Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search templates..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white" />
                </div>
                <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setFilterGroup(''); }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">All Statuses</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                </select>
                {filterGroup && (
                    <button onClick={() => setFilterGroup('')}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition">
                        <Tag className="w-3.5 h-3.5" /> {filterGroup}
                        <X className="w-3.5 h-3.5 ml-1" />
                    </button>
                )}
                <button onClick={() => fetchTemplates(true)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Main content with group sidebar */}
            <div className="flex gap-6">
                {/* ─── Group Sidebar ─────────────────────────────────── */}
                <div className="w-64 shrink-0 hidden lg:block">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-4">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-sm font-bold text-slate-900">Template Groups</h3>
                        </div>

                        {/* My Templates (default) */}
                        <button onClick={() => { setShowLibrary(false); setFilterGroup(''); }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition ${!showLibrary ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                            <span className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-indigo-500" /> My Templates
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${!showLibrary ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{myTemplateCount}</span>
                        </button>

                        {/* Meta Library Section */}
                        <div className="border-t border-slate-100">
                            <button onClick={() => { setShowLibrary(true); setFilterGroup(''); }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between transition ${showLibrary && !filterGroup ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                                <span className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-teal-500" /> Meta Library
                                    <span className="text-xs font-semibold bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full">{templates.filter(t => t.isDefault).length}</span>
                                </span>
                                {showLibrary ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>

                            {showLibrary && (
                                <>
                                    {/* All Library Templates */}
                                    <button onClick={() => setFilterGroup('')}
                                        className={`w-full text-left pl-6 pr-4 py-2 text-xs flex items-center justify-between transition ${showLibrary && !filterGroup ? 'bg-teal-50/50 text-teal-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                                        <span>All Library</span>
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${showLibrary && !filterGroup ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>{templates.filter(t => t.isDefault).length}</span>
                                    </button>

                                    {/* Utility Section */}
                                    <button onClick={() => setExpandedCategory(expandedCategory === 'UTILITY' ? '' : 'UTILITY')}
                                        className="w-full text-left pl-6 pr-4 py-2 text-xs font-bold text-slate-600 flex items-center justify-between hover:bg-slate-50 transition">
                                        <span className="flex items-center gap-2">
                                            <FileText className="w-3 h-3 text-blue-500" /> Utility
                                            <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">151</span>
                                        </span>
                                        {expandedCategory === 'UTILITY' ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </button>
                                    {expandedCategory === 'UTILITY' && utilityGroups.map(g => (
                                        <button key={g.name} onClick={() => setFilterGroup(filterGroup === g.name ? '' : g.name)}
                                            className={`w-full text-left pl-10 pr-4 py-1.5 text-xs flex items-center justify-between transition ${filterGroup === g.name ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                                            <span className="truncate">{g.name}</span>
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${filterGroup === g.name ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{groupCounts[g.name] || g.count}</span>
                                        </button>
                                    ))}

                                    {/* Authentication Section */}
                                    <button onClick={() => setExpandedCategory(expandedCategory === 'AUTHENTICATION' ? '' : 'AUTHENTICATION')}
                                        className="w-full text-left pl-6 pr-4 py-2 text-xs font-bold text-slate-600 flex items-center justify-between hover:bg-slate-50 transition">
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Authentication
                                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">19</span>
                                        </span>
                                        {expandedCategory === 'AUTHENTICATION' ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </button>
                                    {expandedCategory === 'AUTHENTICATION' && authGroups.map(g => (
                                        <button key={g.name} onClick={() => setFilterGroup(filterGroup === g.name ? '' : g.name)}
                                            className={`w-full text-left pl-10 pr-4 py-1.5 text-xs flex items-center justify-between transition ${filterGroup === g.name ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                                            <span className="truncate">{g.name}</span>
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${filterGroup === g.name ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{groupCounts[g.name] || g.count}</span>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Template Grid ────────────────────────────────── */}
                <div className="flex-1 min-w-0">
                    {/* Results count */}
                    <p className="text-xs text-slate-500 mb-4 font-medium">Showing {filtered.length} {showLibrary ? 'library' : ''} templates{filterGroup && <> in <span className="text-indigo-600 font-semibold">{filterGroup}</span></>}</p>

            {/* Content */}
            {loading ? (
                <div className="flex py-20 items-center justify-center"><RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Templates Found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">
                        {searchQ || filterCat || filterStatus
                            ? 'No templates match your filters. Try adjusting your search.'
                            : 'Create your first WhatsApp message template to start sending automated messages.'}
                    </p>
                    <button onClick={() => { resetForm(); setView('create'); }}
                        className="px-6 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition">
                        Create First Template
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {filtered.map(t => (
                        <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition group cursor-pointer"
                            onClick={() => { setSelected(t); setView('preview'); }}>
                            {/* Card Header */}
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate text-sm">{t.name}</h3>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border flex items-center ${statusBadge(t.status)}`}>
                                                {statusIcon(t.status)} {t.status}
                                            </span>
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">{t.category}</span>
                                            {(t as any).group && <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-medium rounded-full border border-violet-200">{(t as any).group}</span>}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{getComponentText(t.components, 'BODY') || 'No body text'}</p>
                            </div>

                            {/* Card Actions */}
                            <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-1">
                                    {t.status === 'APPROVED' && (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); setSelected(t); setView('send'); }}
                                                className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-600 transition" title="Send">
                                                <Send className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setSelected(t); setView('bulk-send'); }}
                                                className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600 transition" title="Bulk Send">
                                                <Users className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                    {!t.isDefault && (
                                        <button onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                                            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition" title="Edit">
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); setSelected(t); setView('preview'); }}
                                        className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-500 transition" title="Preview">
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {!t.isDefault && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(t.name); }}
                                        className="p-1.5 hover:bg-red-100 rounded-lg text-red-400 transition" title="Delete">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
                </div>
            </div>

            {/* Modals */}
            {(view === 'create') && renderForm(false)}
            {(view === 'edit') && renderForm(true)}
            {(view === 'preview') && renderPreview()}
            {(view === 'send') && renderSend()}
            {(view === 'bulk-send') && renderBulkSend()}
        </div>
    );
}
