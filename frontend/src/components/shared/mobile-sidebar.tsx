"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Menu,
    X,
    LayoutDashboard,
    MessageCircle,
    Sparkles,
    Users,
    UserCheck,
    Megaphone,
    ShoppingCart,
    BarChart3,
    Package,
    FileText,
    MessageSquare,
    UserCog,
    Settings,
    Wallet,
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

export function MobileSidebar() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
            {/* Hamburger button */}
            <button
                onClick={() => setOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                aria-label="Open menu"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:hidden ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <span className="font-bold text-xl">LoomiFlow</span>
                    <button
                        onClick={() => setOpen(false)}
                        className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/" && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                            >
                                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
