"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Topbar } from "@/components/shared/topbar";
import { MobileSidebar } from "@/components/shared/mobile-sidebar";
import { Toaster } from "@/components/ui/toaster";
import {
    LayoutDashboard,
    MessageCircle,
    Sparkles,
    UserCheck,
    Users,
    Megaphone,
    ShoppingCart,
    BarChart3,
    Package,
    FileText,
    MessageSquare,
    UserCog,
    Settings,
    Wallet,
    Loader2,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/conversations", label: "Conversations", icon: MessageCircle },
    { href: "/smart-replies", label: "Smart Replies", icon: Sparkles },
    { href: "/leads", label: "Leads", icon: UserCheck },
    { href: "/contacts", label: "Contacts", icon: Users },
    { href: "/broadcasts", label: "Broadcasts", icon: Megaphone },
    { href: "/orders", label: "Orders", icon: ShoppingCart },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/catalogs", label: "Catalogs", icon: Package },
    { href: "/templates", label: "Templates", icon: FileText },
    { href: "/whatsapp", label: "WhatsApp", icon: MessageSquare },
    { href: "/team", label: "Team", icon: UserCog },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/settings", label: "Settings", icon: Settings },
];

// ─── Error Boundary ──────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="text-center p-8 max-w-md">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// ─── Auth Guard ──────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setAuthenticated(true);
                // Ensure the access token cookie is set
                user.getIdToken().then(token => {
                    document.cookie = `accessToken=${token}; path=/; max-age=3600; SameSite=Lax`;
                });
            } else {
                setAuthenticated(false);
                router.replace('/login');
            }
            setChecking(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (checking) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-sm text-slate-500 font-medium">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!authenticated) return null;

    return <>{children}</>;
}

// ─── Dashboard Layout ────────────────────────────────────────────────────────

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <AuthGuard>
            <div className="flex h-screen overflow-hidden bg-slate-50">
                {/* Desktop Sidebar */}
                <div className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
                    <div className="p-4 font-bold text-xl border-b border-slate-800">LoomiFlow</div>
                    <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-sm font-medium tracking-wide">
                        {navItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/" && pathname.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                        isActive
                                            ? "bg-indigo-600 text-white"
                                            : "text-slate-300 hover:bg-slate-800"
                                    }`}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Mobile Sidebar */}
                <MobileSidebar />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <Topbar />
                    <main className="flex-1 overflow-y-auto w-full relative">
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </main>
                </div>
                <Toaster />
            </div>
        </AuthGuard>
    );
}
