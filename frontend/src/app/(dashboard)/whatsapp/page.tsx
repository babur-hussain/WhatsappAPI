'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Loader2, Copy, Check, Wifi, WifiOff, ExternalLink, ShieldCheck } from "lucide-react";

const API_BASE = 'https://loomiflow-backend-production-db59.up.railway.app/api/v1/whatsapp';

function getCookie(name: string) {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : '';
}

export default function WhatsAppPage() {
    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [whatsappBusinessAccountId, setWhatsappBusinessAccountId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [connectedNumber, setConnectedNumber] = useState('');
    const [connectedPhoneNumberId, setConnectedPhoneNumberId] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [verifyResult, setVerifyResult] = useState<{ success: boolean; phoneNumber?: string; error?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const webhookUrl = typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1/webhook`
        : 'https://loomiflow-backend-production-db59.up.railway.app/api/v1/webhook';

    const getHeaders = () => ({
        'Authorization': `Bearer ${getCookie('accessToken')}`,
        'Content-Type': 'application/json',
    });

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/status`, { headers: getHeaders() });
            const data = await res.json();
            if (data.success && data.data) {
                setIsConnected(data.data.connected);
                setConnectedNumber(data.data.phoneNumber || '');
                setConnectedPhoneNumberId(data.data.phoneNumberId || '');
            }
        } catch (e) {
            console.error('Failed to fetch status:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setIsVerifying(true);
        setVerifyResult(null);
        try {
            const res = await fetch(`${API_BASE}/verify`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ phoneNumberId, accessToken }),
            });
            const data = await res.json();
            setVerifyResult(data.data);
        } catch (e) {
            setVerifyResult({ success: false, error: 'Network error' });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            const res = await fetch(`${API_BASE}/connect`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ phoneNumberId, whatsappBusinessAccountId, accessToken, whatsappNumber }),
            });
            const data = await res.json();
            if (data.success) {
                setIsConnected(true);
                setConnectedNumber(data.data.phoneNumber || whatsappNumber);
                setConnectedPhoneNumberId(phoneNumberId);
                setPhoneNumberId('');
                setWhatsappBusinessAccountId('');
                setAccessToken('');
                setWhatsappNumber('');
                setVerifyResult(null);
            }
        } catch (e) {
            console.error('Connection failed:', e);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure? This will stop all WhatsApp messaging for your factory.')) return;
        setIsDisconnecting(true);
        try {
            await fetch(`${API_BASE}/disconnect`, { method: 'POST', headers: getHeaders() });
            setIsConnected(false);
            setConnectedNumber('');
            setConnectedPhoneNumberId('');
        } catch (e) {
            console.error('Disconnect failed:', e);
        } finally {
            setIsDisconnecting(false);
        }
    };

    const handleCopyWebhook = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-xl shadow-inner shadow-white/20 ring-1 ring-black/5">
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </div>
                    WhatsApp Connection
                </h1>
                <p className="text-gray-500 mt-2 text-lg">
                    Connect your WhatsApp Business number to send and receive messages directly.
                </p>
            </div>

            {/* Connection Status */}
            <Card className={`border-2 transition-all duration-300 ${isConnected ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'}`}>
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {isConnected ? (
                            <div className="p-3 bg-green-100 rounded-full">
                                <Wifi className="w-6 h-6 text-green-600" />
                            </div>
                        ) : (
                            <div className="p-3 bg-gray-100 rounded-full">
                                <WifiOff className="w-6 h-6 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <h3 className={`text-lg font-semibold ${isConnected ? 'text-green-800' : 'text-gray-700'}`}>
                                {isConnected ? 'Connected' : 'Not Connected'}
                            </h3>
                            {isConnected ? (
                                <p className="text-sm text-green-600">
                                    Number: {connectedNumber || connectedPhoneNumberId} — Receiving & sending messages
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Configure your Meta WhatsApp Business API credentials below
                                </p>
                            )}
                        </div>
                    </div>
                    {isConnected && (
                        <Button
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={handleDisconnect}
                            disabled={isDisconnecting}
                        >
                            {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Disconnect
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Connect Form */}
            {!isConnected && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="shadow-xl shadow-gray-200/40 border-gray-200/60 overflow-hidden">
                        <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-emerald-400" />
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-500" />
                                Connect WhatsApp
                            </CardTitle>
                            <CardDescription>
                                Enter your Meta Cloud API credentials to start messaging.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Phone Number ID</label>
                                <Input
                                    placeholder="e.g. 114456789012345"
                                    value={phoneNumberId}
                                    onChange={(e) => setPhoneNumberId(e.target.value)}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">WhatsApp Business Account ID</label>
                                <Input
                                    placeholder="e.g. 105678901234567"
                                    value={whatsappBusinessAccountId}
                                    onChange={(e) => setWhatsappBusinessAccountId(e.target.value)}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Access Token</label>
                                <Input
                                    type="password"
                                    placeholder="Your permanent access token"
                                    value={accessToken}
                                    onChange={(e) => setAccessToken(e.target.value)}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Display Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
                                <Input
                                    placeholder="e.g. +1 555 0123"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                    className="text-sm"
                                />
                            </div>

                            {verifyResult && (
                                <div className={`rounded-lg p-3 flex items-center gap-2 text-sm ${verifyResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {verifyResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    {verifyResult.success ? `Verified! Phone: ${verifyResult.phoneNumber}` : verifyResult.error}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-gray-50/50 border-t flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={handleVerify}
                                disabled={!phoneNumberId.trim() || !whatsappBusinessAccountId.trim() || !accessToken.trim() || isVerifying}
                            >
                                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Test Connection
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20"
                                onClick={handleConnect}
                                disabled={!phoneNumberId.trim() || !whatsappBusinessAccountId.trim() || !accessToken.trim() || isConnecting}
                            >
                                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Connect & Save
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Setup Instructions */}
                    <Card className="shadow-xl shadow-gray-200/40 border-gray-200/60 overflow-hidden">
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-400" />
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <ExternalLink className="w-5 h-5 text-blue-500" />
                                Meta Developer Setup
                            </CardTitle>
                            <CardDescription>
                                Follow these steps to get your WhatsApp API credentials.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ol className="space-y-4 text-sm text-gray-700">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">1</span>
                                    <span>Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">developers.facebook.com</a> and create or select your app.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">2</span>
                                    <span>Add the <strong>WhatsApp</strong> product to your Meta app.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">3</span>
                                    <span>In <strong>WhatsApp → API Setup</strong>, copy the <strong>Phone Number ID</strong> and generate a <strong>permanent access token</strong>.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">4</span>
                                    <span>In <strong>WhatsApp → Configuration</strong>, set the webhook URL below and subscribe to <strong>messages</strong>.</span>
                                </li>
                            </ol>

                            <div className="mt-4 space-y-2">
                                <label className="text-sm font-medium text-gray-700">Your Webhook URL</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        readOnly
                                        value={webhookUrl}
                                        className="font-mono text-xs bg-gray-50"
                                    />
                                    <Button variant="outline" size="icon" onClick={handleCopyWebhook}>
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-2 space-y-2">
                                <label className="text-sm font-medium text-gray-700">Webhook Verify Token</label>
                                <Input
                                    readOnly
                                    value="loomiflow_test_token"
                                    className="font-mono text-xs bg-gray-50"
                                />
                                <p className="text-xs text-gray-400">Use this token in Meta's webhook verification field.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
