"use client";

import React, { useState, useEffect } from 'react';
import {
    UserCog,
    Plus,
    Trash2,
    RefreshCw,
    Search,
    Shield,
    User,
    Mail,
    Phone,
    Clock,
    X,
    Loader2,
    AlertCircle,
    Crown,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TeamMember {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: 'FACTORY_ADMIN' | 'SALES';
    createdAt: string;
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

const ROLE_CONFIG = {
    FACTORY_ADMIN: {
        label: 'Admin',
        bg: 'bg-indigo-100',
        text: 'text-indigo-700',
        icon: Crown,
    },
    SALES: {
        label: 'Sales Agent',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        icon: User,
    },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function TeamPage() {
    const { toast } = useToast();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [search, setSearch] = useState('');

    // Invite form
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitePhone, setInvitePhone] = useState('');
    const [inviteRole, setInviteRole] = useState<'FACTORY_ADMIN' | 'SALES'>('SALES');
    const [invitePassword, setInvitePassword] = useState('');
    const [inviting, setInviting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/auth/team`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setMembers(data.data?.users || data.data || []);
            }
        } catch (e) {
            console.log('Failed to fetch team members', e);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        setErrorMsg('');

        try {
            const res = await fetch(`${API_BASE}/api/v1/auth/invite`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    name: inviteName,
                    email: inviteEmail,
                    phone: invitePhone || undefined,
                    role: inviteRole,
                    password: invitePassword,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast({ title: 'Team member added', description: `${inviteName} has been added to your team.` });
                setShowInviteModal(false);
                setInviteName('');
                setInviteEmail('');
                setInvitePhone('');
                setInvitePassword('');
                setInviteRole('SALES');
                fetchMembers();
            } else {
                setErrorMsg(data.message || data.error?.message || 'Failed to invite member');
            }
        } catch {
            setErrorMsg('An unexpected error occurred.');
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (memberId: string, memberName: string) => {
        if (!confirm(`Remove ${memberName} from your team? This action cannot be undone.`)) return;

        try {
            const res = await fetch(`${API_BASE}/api/v1/auth/team/${memberId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (res.ok) {
                toast({ title: 'Member removed', description: `${memberName} has been removed from your team.` });
                fetchMembers();
            } else {
                toast({ title: 'Error', description: 'Failed to remove team member', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to remove team member', variant: 'destructive' });
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
                        <UserCog className="w-8 h-8 mr-3 text-indigo-600" />
                        Team Management
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Manage sales agents and administrators for your factory.
                    </p>
                </div>
                <button
                    onClick={() => { setShowInviteModal(true); setErrorMsg(''); }}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Member</span>
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                    />
                </div>
            </div>

            {/* Team Members */}
            {loading ? (
                <div className="flex py-20 items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserCog className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Team Members</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">
                        {search ? 'No members match your search.' : 'Add your first team member to start collaborating.'}
                    </p>
                    {!search && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="px-6 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
                        >
                            Add First Member
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMembers.map(member => {
                        const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.SALES;
                        const RoleIcon = roleConfig.icon;
                        return (
                            <div
                                key={member.id}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                                            {member.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{member.name}</h3>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${roleConfig.bg} ${roleConfig.text}`}>
                                                <RoleIcon className="w-3 h-3" />
                                                {roleConfig.label}
                                            </span>
                                        </div>
                                    </div>
                                    {member.role !== 'FACTORY_ADMIN' && (
                                        <button
                                            onClick={() => handleRemove(member.id, member.name)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center text-slate-500">
                                        <Mail className="w-4 h-4 mr-2 text-slate-400" />
                                        {member.email}
                                    </div>
                                    {member.phone && (
                                        <div className="flex items-center text-slate-500">
                                            <Phone className="w-4 h-4 mr-2 text-slate-400" />
                                            {member.phone}
                                        </div>
                                    )}
                                    <div className="flex items-center text-slate-400 text-xs">
                                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                                        Joined {format(new Date(member.createdAt), 'MMM d, yyyy')}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <form onSubmit={handleInvite} className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                <Plus className="w-5 h-5 mr-2 text-indigo-600" />
                                Add Team Member
                            </h2>
                            <button type="button" onClick={() => setShowInviteModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 py-6 space-y-5">
                            {errorMsg && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={inviteName}
                                    onChange={e => setInviteName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
                                <input
                                    required
                                    type="password"
                                    value={invitePassword}
                                    onChange={e => setInvitePassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    minLength={6}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                                <input
                                    type="tel"
                                    value={invitePhone}
                                    onChange={e => setInvitePhone(e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Role</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {([
                                        { key: 'SALES' as const, label: 'Sales Agent', desc: 'Can view & manage leads', icon: User },
                                        { key: 'FACTORY_ADMIN' as const, label: 'Admin', desc: 'Full access to all settings', icon: Shield },
                                    ]).map(role => (
                                        <button
                                            key={role.key}
                                            type="button"
                                            onClick={() => setInviteRole(role.key)}
                                            className={`p-4 rounded-xl border text-left transition ${inviteRole === role.key
                                                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                        >
                                            <role.icon className={`w-5 h-5 mb-2 ${inviteRole === role.key ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            <h4 className={`font-bold text-sm mb-0.5 ${inviteRole === role.key ? 'text-indigo-900' : 'text-slate-900'}`}>
                                                {role.label}
                                            </h4>
                                            <p className={`text-xs ${inviteRole === role.key ? 'text-indigo-700' : 'text-slate-500'}`}>
                                                {role.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end space-x-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => setShowInviteModal(false)}
                                className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={inviting || !inviteName || !inviteEmail || !invitePassword}
                                className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center"
                            >
                                {inviting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Member
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
