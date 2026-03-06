import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Authentication | LoomiFlow',
    description: 'Login or Register for your Factory SaaS account',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
            {children}
        </div>
    );
}
