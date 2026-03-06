"use client";

import { NotificationBell } from './notification-bell';

export function Topbar() {
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
