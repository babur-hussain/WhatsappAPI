"use client";

import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Clock,
    ToggleLeft,
    ToggleRight,
    Save,
    Loader2,
    ArrowLeft,
    Zap,
    RefreshCw,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FollowUpConfig {
    number: number;
    enabled: boolean;
    delaySeconds: number;
    message: string;
}

interface FollowUpSettings {
    followUpsEnabled: boolean;
    followUps: FollowUpConfig[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = 'https://whatsappapi.lfvs.in/api/v1/followups';
const getHeaders = () => {
    const token = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/)?.[1] || '' : '';
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

const DELAY_OPTIONS = [
    { label: '1 hour', value: 3600 },
    { label: '3 hours', value: 10800 },
    { label: '6 hours', value: 21600 },
    { label: '12 hours', value: 43200 },
    { label: '24 hours', value: 86400 },
    { label: '48 hours', value: 172800 },
    { label: '72 hours', value: 259200 },
    { label: '1 week', value: 604800 },
];

function formatDelay(seconds: number): string {
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    return `${Math.round(seconds / 86400)} days`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FollowUpSettingsPage() {
    const [settings, setSettings] = useState<FollowUpSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setSettings(data.data);
            }
        } catch (e) {
            console.log('Failed to fetch follow-up settings', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch(`${API_BASE}/settings`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({
                    followUpsEnabled: settings.followUpsEnabled,
                    followUps: settings.followUps.map((fu) => ({
                        number: fu.number,
                        enabled: fu.enabled,
                        delaySeconds: fu.delaySeconds,
                        message: fu.message,
                    })),
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(data.data);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (e) {
            console.log('Failed to save settings', e);
        } finally {
            setSaving(false);
        }
    };

    const toggleGlobal = () => {
        if (!settings) return;
        setSettings({ ...settings, followUpsEnabled: !settings.followUpsEnabled });
    };

    const toggleFollowUp = (index: number) => {
        if (!settings) return;
        const updated = [...settings.followUps];
        updated[index] = { ...updated[index], enabled: !updated[index].enabled };
        setSettings({ ...settings, followUps: updated });
    };

    const updateDelay = (index: number, delaySeconds: number) => {
        if (!settings) return;
        const updated = [...settings.followUps];
        updated[index] = { ...updated[index], delaySeconds };
        setSettings({ ...settings, followUps: updated });
    };

    const updateMessage = (index: number, message: string) => {
        if (!settings) return;
        const updated = [...settings.followUps];
        updated[index] = { ...updated[index], message };
        setSettings({ ...settings, followUps: updated });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-slate-500 text-sm font-medium">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <p className="text-slate-500">Failed to load settings</p>
            </div>
        );
    }

    const followUpLabels = ['First Follow-Up', 'Second Follow-Up', 'Third Follow-Up'];
    const followUpColors = [
        { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600', badge: 'bg-blue-100 text-blue-700' },
        { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600', badge: 'bg-amber-100 text-amber-700' },
        { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'bg-violet-100 text-violet-600', badge: 'bg-violet-100 text-violet-700' },
    ];

    return (
        <div className="p-8 h-[calc(100vh-4rem)] overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <a href="/settings" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </a>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Follow-Up Automation
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Automatically send follow-up messages to unresponsive leads.
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${saved
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        } disabled:opacity-50`}
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                        <RefreshCw className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}</span>
                </button>
            </div>

            {/* Global Toggle */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Auto Follow-Ups</h3>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {settings.followUpsEnabled
                                    ? 'Follow-up messages are active for new leads'
                                    : 'Follow-up messages are currently disabled'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={toggleGlobal}
                        className="focus:outline-none"
                    >
                        {settings.followUpsEnabled ? (
                            <ToggleRight className="w-12 h-12 text-indigo-600" />
                        ) : (
                            <ToggleLeft className="w-12 h-12 text-slate-300" />
                        )}
                    </button>
                </div>
            </div>

            {/* Follow-Up Cards */}
            <div className={`space-y-5 transition-opacity ${settings.followUpsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                {settings.followUps.map((fu, index) => {
                    const colors = followUpColors[index];
                    return (
                        <div
                            key={fu.number}
                            className={`bg-white rounded-2xl border ${fu.enabled ? colors.border : 'border-slate-200'} shadow-sm overflow-hidden transition-all`}
                        >
                            {/* Card Header */}
                            <div className={`px-6 py-4 flex items-center justify-between ${fu.enabled ? colors.bg : 'bg-slate-50'}`}>
                                <div className="flex items-center space-x-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors.icon}`}>
                                        <MessageSquare className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">{followUpLabels[index]}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Sent {formatDelay(fu.delaySeconds)} after lead created
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${fu.enabled ? colors.badge : 'bg-slate-100 text-slate-500'}`}>
                                        {fu.enabled ? 'Active' : 'Disabled'}
                                    </span>
                                    <button
                                        onClick={() => toggleFollowUp(index)}
                                        className="focus:outline-none"
                                    >
                                        {fu.enabled ? (
                                            <ToggleRight className="w-8 h-8 text-indigo-600" />
                                        ) : (
                                            <ToggleLeft className="w-8 h-8 text-slate-300" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Card Body */}
                            {fu.enabled && (
                                <div className="px-6 py-5 space-y-4">
                                    {/* Delay Selector */}
                                    <div>
                                        <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                                            <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                            Send After
                                        </label>
                                        <select
                                            value={fu.delaySeconds}
                                            onChange={(e) => updateDelay(index, parseInt(e.target.value))}
                                            className="w-full sm:w-64 py-2.5 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        >
                                            {DELAY_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Message Editor */}
                                    <div>
                                        <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                                            <MessageSquare className="w-4 h-4 mr-2 text-slate-400" />
                                            Message Template
                                        </label>
                                        <textarea
                                            value={fu.message}
                                            onChange={(e) => updateMessage(index, e.target.value)}
                                            rows={3}
                                            className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                            placeholder="Enter follow-up message..."
                                        />
                                        <p className="text-xs text-slate-400 mt-1.5">
                                            Use <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{'{factoryName}'}</code> to include your factory name dynamically.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Info Card */}
            <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-indigo-900 mb-2">How Follow-Ups Work</h4>
                <ul className="text-sm text-indigo-700 space-y-1.5 list-disc list-inside">
                    <li>Follow-ups are automatically scheduled when a new lead is created</li>
                    <li>If the customer replies, all pending follow-ups are <strong>automatically cancelled</strong></li>
                    <li>Messages are sent via WhatsApp using your connected number</li>
                    <li>Follow-ups respect your enabled/disabled configuration per message</li>
                </ul>
            </div>
        </div>
    );
}
