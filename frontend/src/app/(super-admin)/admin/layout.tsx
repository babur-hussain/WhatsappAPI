'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Toaster } from '@/components/ui/toaster';
import { Building2, LayoutDashboard, CreditCard, UsersRound, LogOut } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AdminUser {
    email: string;
    role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                const token = await user.getIdToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://loomiflow-backend-production-db59.up.railway.app'}/api/v1/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.data && data.data.role === 'SUPER_ADMIN') {
                        setAdminUser({ email: data.data.email, role: data.data.role });
                        setLoading(false);
                    } else {
                        router.push('/leads');
                    }
                } else {
                    router.push('/login');
                }
            } catch (error) {
                console.error('Auth check error:', error);
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading || !adminUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <div className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
                <div className="p-6 font-bold text-2xl tracking-tight border-b border-slate-800 text-indigo-400">
                    SuperAdmin
                </div>
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 text-sm text-slate-300 font-medium">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
                        <LayoutDashboard size={18} />
                        Dashboard
                    </Link>
                    <Link href="/admin/factories" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
                        <Building2 size={18} />
                        Factories
                    </Link>
                    <Link href="/admin/subscriptions" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
                        <CreditCard size={18} />
                        Subscriptions
                    </Link>
                    <Link href="/admin/payments" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
                        <UsersRound size={18} />
                        Payments
                    </Link>
                </nav>
            </div>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Admin Topbar */}
                <header className="h-16 flex items-center justify-between border-b bg-white px-6 shadow-sm z-10">
                    <div className="font-semibold text-slate-800">Platform Management</div>
                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="focus:outline-none">
                                <Avatar className="h-9 w-9 border-2 border-indigo-100 hover:border-indigo-200 transition-colors cursor-pointer">
                                    <AvatarFallback className="bg-indigo-600 text-white text-sm">
                                        SA
                                    </AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl shadow-lg border-slate-100 p-2">
                                <DropdownMenuLabel className="font-normal border-b pb-2 mb-2">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold leading-none text-slate-900">Platform Owner</p>
                                        <p className="text-xs leading-none text-slate-500">{adminUser.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50 cursor-pointer rounded-lg flex items-center gap-2 py-2"
                                >
                                    <LogOut size={16} />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto w-full relative p-6 bg-slate-50">
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    );
}
