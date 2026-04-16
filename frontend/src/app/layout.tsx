import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "LoomiFlow — WhatsApp CRM for Factories",
    description: "Automate your WhatsApp conversations, manage leads, send broadcasts, and grow your B2B business with AI-powered smart replies.",
    icons: {
        icon: "/favicon.svg",
    },
    openGraph: {
        title: "LoomiFlow — WhatsApp CRM for Factories",
        description: "Automate WhatsApp conversations, manage leads, and grow your B2B business.",
        type: "website",
    },
    viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    themeColor: "#4f46e5",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
