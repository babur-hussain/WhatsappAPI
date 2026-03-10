"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
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
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    );
}
