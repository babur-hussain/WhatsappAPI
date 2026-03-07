"use client";

import { useEffect } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { NotificationBell } from './notification-bell';

export function Topbar() {
    // Keep the accessToken cookie fresh: whenever Firebase rotates the ID token
    // (every ~1 hour), write the new token back to the cookie with a 7-day max-age.
    // This prevents the middleware from seeing a missing/expired cookie and redirecting
    // the user to /login unexpectedly.
    useEffect(() => {
        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            if (user) {
                const token = await user.getIdToken();
                document.cookie = `accessToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0">
            <div className="font-semibold text-lg tracking-tight text-slate-800">LoomiFlow</div>
            <div className="flex items-center space-x-4">
                <NotificationBell />
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                    A
                </div>
            </div>
        </div>
    );
}
