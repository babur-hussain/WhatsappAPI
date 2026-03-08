"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, KeySquare, Link2, CheckCircle2 } from "lucide-react";

export default function WhatsAppSettingsPage() {
    const { toast } = useToast();
    const [factory, setFactory] = useState<any>(null);
    const [metaConfig, setMetaConfig] = useState({ webhookUrl: '', verifyToken: '' });

    useEffect(() => {
        // We simulate fetching the global webhook URL and verify token 
        // that the user needs to paste into the Meta Developer Dashboard.
        // In a real prod environment, these might be read from an admin config endpoint.
        const origin = window.location.origin.replace("3000", "8000"); // Assuming backend is on 8000
        setMetaConfig({
            webhookUrl: `${origin}/api/v1/billing/webhook`, // Or whatsapp webhook
            verifyToken: "LOOMIFLOW_WEBHOOK_SECRET_2025" // Demo static
        });

        // Fetch User
        const token = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/)?.[1] || "";
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.factory) {
                    setFactory(data.data.factory);
                }
            });
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">WhatsApp Integration</h1>
                <p className="text-slate-500 mt-2">Connect and configure your Meta WhatsApp Cloud API credentials.</p>
            </div>

            <div className="grid gap-8 mb-8 md:grid-cols-2">
                <Card className="border-emerald-200 shadow-sm bg-emerald-50/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center text-emerald-800">
                            <CheckCircle2 className="w-5 h-5 mr-2" /> Connection Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {factory?.isWhatsappConnected ? (
                            <div className="space-y-4">
                                <p className="text-sm text-emerald-700 font-medium">Your WhatsApp Business API is currently connected and actively listening for leads.</p>
                                <div className="p-3 bg-white rounded border border-emerald-100 shadow-sm">
                                    <Label className="text-xs text-slate-500 uppercase">Connected Number</Label>
                                    <p className="font-mono text-emerald-900 mt-1">{factory?.whatsappNumber || "Not available"}</p>
                                </div>
                                <div className="p-3 bg-white rounded border border-emerald-100 shadow-sm">
                                    <Label className="text-xs text-slate-500 uppercase">Phone ID</Label>
                                    <p className="font-mono text-emerald-900 mt-1">{factory?.whatsappPhoneNumberId || "Not available"}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600">You have no active WhatsApp connection. Please complete the onboarding flow.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Meta App Configuration</CardTitle>
                        <CardDescription>
                            Paste these values into your Meta Developer Dashboard under 'WhatsApp' -&gt; 'Configuration'
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Webhook Callback URL</Label>
                            <div className="flex gap-2">
                                <Input readOnly value={metaConfig.webhookUrl} className="font-mono bg-slate-50 text-sm" />
                                <Button variant="secondary" onClick={() => copyToClipboard(metaConfig.webhookUrl)}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Verify Token</Label>
                            <div className="flex gap-2">
                                <Input readOnly value={metaConfig.verifyToken} className="font-mono bg-slate-50 text-sm" />
                                <Button variant="secondary" onClick={() => copyToClipboard(metaConfig.verifyToken)}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Setup Instructions</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none text-sm">
                    <ol className="space-y-4">
                        <li>Go to the <a href="https://developers.facebook.com/" target="_blank" className="text-indigo-600 font-medium">Meta Developer Portal</a> and create a new App.</li>
                        <li>Select "Other" -&gt; "Business" and set up the WhatsApp product.</li>
                        <li>In the WhatsApp -&gt; Setup menu, you will see a temporary access token and a Phone Number ID. Use this ID in our onboarding screen.</li>
                        <li>Go to WhatsApp -&gt; Configuration. Click "Edit" next to Webhook.</li>
                        <li>Paste the Callback URL and Verify Token provided above. Click "Verify and Save".</li>
                        <li>Finally, under Webhook Fields, click "Manage" and subscribe to the <strong>messages</strong> event.</li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}
