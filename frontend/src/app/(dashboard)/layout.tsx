import Link from "next/link";
import { Topbar } from "@/components/shared/topbar";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Sidebar placeholder - to be implemented */}
            <div className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
                <div className="p-4 font-bold text-xl border-b border-slate-800">LoomiFlow</div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-2 text-sm text-slate-300 font-medium tracking-wide">
                    <Link href="/" className="block px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">Dashboard</Link>
                    <Link href="/conversations" className="block px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">Conversations</Link>
                    <Link href="/smart-replies" className="block px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer text-indigo-400 font-semibold">Smart Replies</Link>
                    <Link href="/leads" className="block px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">Leads</Link>
                    <Link href="/broadcasts" className="block px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">Broadcasts</Link>
                    <Link href="/orders" className="block px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">Orders</Link>
                    <Link href="/analytics" className="block px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">Analytics</Link>
                    <Link href="/catalogs" className="block px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">Catalogs</Link>
                    <Link href="/templates" className="block px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">Templates</Link>
                    <Link href="/whatsapp" className="block px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">WhatsApp</Link>
                    <Link href="/team" className="block px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">Team</Link>
                    <Link href="/settings" className="block px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">Settings</Link>
                </nav>
            </div>

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
