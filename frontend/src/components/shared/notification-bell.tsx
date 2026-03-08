"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Notification {
    id: string;
    type: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Auth mock
    const factoryId = 'mock-factory-id';
    const apiUrl = 'http://16.170.213.68:8000/api/v1/notifications';
    const headers = {
        'Authorization': 'Bearer test',
        'x-factory-id': factoryId,
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30s as fallback to WS
        const int = setInterval(fetchNotifications, 30000);
        return () => clearInterval(int);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(apiUrl, { headers });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
            }
        } catch (e) { }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`${apiUrl}/${id}/read`, { method: 'PATCH', headers });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) { }
    };

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 text-[8px] font-bold text-white items-center justify-center"></span>
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">{unreadCount} new</span>
                    )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center">
                            <Bell className="w-8 h-8 text-slate-300 mb-2" />
                            You're all caught up!
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`p-4 transition-colors hover:bg-slate-50 flex items-start space-x-3 cursor-pointer ${n.isRead ? 'opacity-60' : ''}`}
                                    onClick={() => !n.isRead && markAsRead(n.id)}
                                >
                                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-blue-500'}`} />
                                    <div className="flex-1 space-y-1">
                                        <p className={`text-sm ${n.isRead ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                                            {n.content}
                                        </p>
                                        <p className="text-xs text-slate-400 flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatTimeAgo(n.createdAt)}
                                        </p>
                                    </div>
                                    {!n.isRead && (
                                        <button onClick={(e) => { e.stopPropagation(); markAsRead(n.id) }} className="p-1 hover:bg-slate-200 rounded-md text-slate-400">
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
