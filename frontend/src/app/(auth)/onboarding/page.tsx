"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle2, MessageSquare, UploadCloud, Rocket } from "lucide-react";

export default function OnboardingPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [phoneNumberId, setPhoneNumberId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [factory, setFactory] = useState<any>(null);

    const getAuthToken = () => {
        if (typeof document === 'undefined') return '';
        const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
        return match ? match[1] : '';
    };

    useEffect(() => {
        // Fetch current onboarding status
        fetch(`\${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me', { headers: { 'Authorization': `Bearer ${getAuthToken()}` } }) // Simplified auth header
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.factory) {
                    setFactory(data.data.factory);
                    const isConnected = data.data.factory.isWhatsappConnected;
                    const isUploaded = data.data.factory.isCatalogUploaded;
                    if (data.data.factory.isOnboardingComplete) {
                        router.push('/leads');
                    } else if (isConnected && isUploaded) {
                        setStep(3); // Ready to complete
                    } else if (isConnected) {
                        setStep(2); // Catalog upload next
                    }
                }
            });
    }, [router]);

    const handleConnectWhatsapp = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL}/api/v1/factory/whatsapp-number', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ whatsappNumber, whatsappPhoneNumberId: phoneNumberId })
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "WhatsApp Connected!" });
                setStep(2);
            } else {
                toast({ title: "Error", description: data.error?.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Connection failed", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCatalogUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL}/api/v1/catalog/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Catalog Uploaded!" });
                setStep(3);
            } else {
                toast({ title: "Error", description: data.error?.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Upload failed", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const completeOnboarding = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL}/api/v1/factory/complete-onboarding', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Welcome to LoomiFlow!" });
                router.push('/leads');
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to complete onboarding", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Factory Setup Guide</h1>
                    <p className="text-slate-500 mt-2">Just a few more steps to launch your automated WhatsApp sales machine.</p>
                </div>

                <div className="flex justify-between relative px-8 py-4">
                    <div className="absolute top-1/2 left-10 right-10 h-1 bg-slate-200 -translate-y-1/2 -z-10 rounded"></div>
                    <div className="absolute top-1/2 left-10 h-1 bg-indigo-600 -translate-y-1/2 -z-10 rounded transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>

                    <div className={`flex flex-col items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step > 1 ? 'bg-indigo-600 text-white' : step === 1 ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-600' : 'bg-slate-100 border-2 border-slate-200'}`}>
                            {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider">WhatsApp</span>
                    </div>
                    <div className={`flex flex-col items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step > 2 ? 'bg-indigo-600 text-white' : step === 2 ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-600' : 'bg-slate-100 border-2 border-slate-200'}`}>
                            {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider">Catalog</span>
                    </div>
                    <div className={`flex flex-col items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step > 3 ? 'bg-indigo-600 text-white' : step === 3 ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-600' : 'bg-slate-100 border-2 border-slate-200'}`}>
                            3
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider">Launch</span>
                    </div>
                </div>

                <div className="mt-8 relative overflow-hidden bg-white shadow-xl rounded-2xl border border-slate-100 p-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
                            <div className="flex items-center gap-4 border-b pb-6">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                    <MessageSquare className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Connect WhatsApp</h2>
                                    <p className="text-slate-500 text-sm">Link your Meta Cloud API number.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>WhatsApp Business Phone Number</Label>
                                    <Input placeholder="e.g., 15551234567" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number ID (From Meta Dashboard)</Label>
                                    <Input placeholder="e.g., 1059345864123" value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-md" onClick={handleConnectWhatsapp} disabled={!whatsappNumber || !phoneNumberId || isLoading}>
                                    {isLoading ? "Connecting..." : "Confirm Connection"}
                                </Button>
                                <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-700" onClick={() => setStep(2)} disabled={isLoading}>
                                    Skip for now
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
                            <div className="flex items-center gap-4 border-b pb-6">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                    <UploadCloud className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Upload Base Catalog</h2>
                                    <p className="text-slate-500 text-sm">This is the PDF sent automatically to new leads.</p>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <p className="text-sm font-medium text-slate-900">Click to upload or drag and drop</p>
                                <p className="text-xs text-slate-500 mt-1">PDF or Images up to 20MB</p>
                                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,image/*" onChange={handleCatalogUpload} disabled={isLoading} />
                            </div>
                            {isLoading && <p className="text-center text-sm text-indigo-600 animate-pulse">Uploading securely to S3...</p>}
                            <div className="pt-2">
                                <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-700" onClick={() => setStep(3)} disabled={isLoading}>
                                    Skip for now
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 text-center animate-in slide-in-from-right-4 fade-in duration-500 py-8">
                            <div className="mx-auto w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Rocket className="w-12 h-12 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-extrabold text-slate-900">You're All Set!</h2>
                                <p className="text-slate-500 mt-2 max-w-sm mx-auto">Your factory is connected and the webhook is active. You will now automatically capture incoming WhatsApp leads.</p>
                            </div>
                            <Button className="w-full max-w-sm mx-auto bg-indigo-600 hover:bg-indigo-700 py-6 text-md font-bold" onClick={completeOnboarding} disabled={isLoading}>
                                Go to Dashboard
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
