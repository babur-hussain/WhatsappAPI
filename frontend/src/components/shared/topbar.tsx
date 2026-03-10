"use client";

import { useEffect, useState, useRef } from 'react';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { NotificationBell } from './notification-bell';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export function Topbar() {
    const router = useRouter();
    const [user, setUser] = useState<{ email: string; displayName: string | null } | null>(null);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Keep the accessToken cookie fresh: whenever Firebase rotates the ID token
    // (every ~1 hour), write the new token back to the cookie with a 7-day max-age.
    useEffect(() => {
        const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const token = await firebaseUser.getIdToken();
                document.cookie = `accessToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
                setUser({ email: firebaseUser.email || '', displayName: firebaseUser.displayName });
            } else {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/login');
    };

    const initials = user?.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.email?.[0]?.toUpperCase() ?? 'A';

    return (
        <div className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
            <div className="font-semibold text-lg tracking-tight text-slate-800 md:opacity-100">LoomiFlow</div>
            <div className="flex items-center space-x-3 md:space-x-4">
                <NotificationBell />

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setOpen(prev => !prev)}
                        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        aria-label="Profile menu"
                    >
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white select-none">
                            {initials}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* User Info */}
                            <div className="px-4 py-3 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                        {initials}
                                    </div>
                                    <div className="min-w-0">
                                        {user?.displayName && (
                                            <p className="text-sm font-semibold text-slate-800 truncate">{user.displayName}</p>
                                        )}
                                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="py-1">
                                <Link
                                    href="/settings"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <Settings className="w-4 h-4 text-slate-400" />
                                    Settings
                                </Link>
                                <Link
                                    href="/team"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <User className="w-4 h-4 text-slate-400" />
                                    Team
                                </Link>
                            </div>

                            <div className="border-t border-slate-100 py-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
