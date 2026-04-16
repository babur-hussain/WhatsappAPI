"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Settings,
    Key,
    Link2,
    MessageCircle,
    Zap,
    CreditCard,
    Copy,
    Check,
    RefreshCw,
    Loader2,
    ChevronRight,
    Shield,
    Globe,
    Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FactorySettings {
    apiKey: string | null;
    webhookUrl: string | null;
    webhookSecret: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://whatsappapi.lfvs.in';
const getHeaders = () => {
    const token = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/)?.[1] || '' : '';
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

// ─── Navigation Items ────────────────────────────────────────────────────────

const settingsLinks = [
    {
        href: '/settings/whatsapp',
        label: 'WhatsApp Integration',
        desc: 'Connect and manage your Meta WhatsApp Cloud API credentials.',
        icon: MessageCircle,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
    },
    {
        href: '/settings/followups',
        label: 'Follow-Up Automation',
        desc: 'Configure automated follow-up messages for unresponsive leads.',
        icon: Zap,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
    },
    {
        href: '/settings/billing',
        label: 'Billing & Subscription',
        desc: 'Manage your subscription plan and view payment history.',
        icon: CreditCard,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
    },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<FactorySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [savingWebhook, setSavingWebhook] = useState(false);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookSecret, setWebhookSecret] = useState('');
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/v1/settings/api-key`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setSettings(data.data);
                setWebhookUrl(data.data?.webhookUrl || '');
                setWebhookSecret(data.data?.webhookSecret || '');
            }
        } catch (e) {
            console.log('Failed to fetch settings', e);
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateKey = async () => {
        if (!confirm('Are you sure? This will invalidate your current API key.')) return;
        setRegenerating(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/settings/api-key/regenerate`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => prev ? { ...prev, apiKey: data.data.apiKey } : prev);
                toast({ title: 'API Key Regenerated', description: 'Your new API key is active now.' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to regenerate API key', variant: 'destructive' });
        } finally {
            setRegenerating(false);
        }
    };

    const handleSaveWebhook = async () => {
        setSavingWebhook(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/settings/webhook`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ webhookUrl, webhookSecret }),
            });
            if (res.ok) {
                toast({ title: 'Webhook Updated', description: 'Your webhook configuration has been saved.' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to update webhook', variant: 'destructive' });
        } finally {
            setSavingWebhook(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
                    <Settings className="w-8 h-8 mr-3 text-indigo-600" />
                    Settings
                </h1>
                <p className="text-slate-500 mt-1">
                    Manage your factory configuration, API keys, and integrations.
                </p>
            </div>

            <div className="max-w-4xl space-y-6">
                {/* API Key Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Key className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">API Key</h3>
                            <p className="text-xs text-slate-500">Use this key to authenticate external API requests from n8n, Zapier, or custom integrations.</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm text-slate-700 truncate select-all">
                                {settings?.apiKey || 'No API key generated'}
                            </div>
                            {settings?.apiKey && (
                                <button
                                    onClick={() => copyToClipboard(settings.apiKey!, 'apiKey')}
                                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition shrink-0"
                                >
                                    {copiedField === 'apiKey' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                </button>
                            )}
                            <button
                                onClick={handleRegenerateKey}
                                disabled={regenerating}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 shrink-0"
                            >
                                {regenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                {settings?.apiKey ? 'Regenerate' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Webhook Configuration Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Globe className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Outgoing Webhook</h3>
                            <p className="text-xs text-slate-500">Forward events (new leads, messages, orders) to an external URL for your custom integrations.</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Webhook URL</label>
                            <input
                                type="url"
                                value={webhookUrl}
                                onChange={e => setWebhookUrl(e.target.value)}
                                placeholder="https://your-server.com/webhook"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-mono transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Webhook Secret</label>
                            <input
                                type="text"
                                value={webhookSecret}
                                onChange={e => setWebhookSecret(e.target.value)}
                                placeholder="Optional secret for verifying payloads"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-mono transition"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveWebhook}
                                disabled={savingWebhook}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                {savingWebhook && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save Webhook
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Links to Sub-settings */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Configuration</h3>
                    {settingsLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-slate-300 transition group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${link.bg} rounded-xl flex items-center justify-center`}>
                                    <link.icon className={`w-6 h-6 ${link.color}`} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{link.label}</h4>
                                    <p className="text-sm text-slate-500 mt-0.5">{link.desc}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
