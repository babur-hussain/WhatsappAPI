"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquareText, Save, Loader2 } from "lucide-react";

export default function SmartRepliesPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // State
    const [enabled, setEnabled] = useState(true);
    const [replyType, setReplyType] = useState<"STATIC" | "AI">("STATIC");
    const [staticMessage, setStaticMessage] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiModel, setAiModel] = useState("gpt-4o-mini");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/auto-reply`, {
                headers: { 'Authorization': `Bearer ${document.cookie}` }
            });
            const data = await res.json();
            
            if (data.success && data.data) {
                setEnabled(data.data.autoReplyEnabled);
                setReplyType(data.data.autoReplyType);
                setStaticMessage(data.data.autoReplyStaticMessage || "Thank you for your message! Our team will get back to you shortly.");
                setAiPrompt(data.data.autoReplyAiPrompt || "You are a professional AI sales assistant.\nYour job is to:\n1. Reply professionally, helpfully, and concisely.\n2. Assist customers with inquiries.");
                setAiModel(data.data.autoReplyAiModel || "gpt-4o-mini");
            }
        } catch (error) {
            toast({
                title: "Error fetching settings",
                description: "Could not load auto-reply settings.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                autoReplyEnabled: enabled,
                autoReplyType: replyType,
                autoReplyStaticMessage: staticMessage,
                autoReplyAiPrompt: aiPrompt,
                autoReplyAiModel: aiModel
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/auto-reply`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${document.cookie}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (data.success) {
                toast({ title: "Settings saved successfully", variant: "default" });
            } else {
                throw new Error(data.message || "Failed to save");
            }
        } catch (error: any) {
            toast({
                title: "Error saving settings",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Smart Replies</h1>
                    <p className="text-slate-500 mt-2">Configure how your WhatsApp bots interact with incoming leads.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <Card className={enabled ? 'border-indigo-200 shadow-sm' : 'border-slate-200'}>
                <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Master Toggle</CardTitle>
                        <CardDescription>Enable or disable automatic responses entirely.</CardDescription>
                    </div>
                    <Switch 
                        checked={enabled} 
                        onCheckedChange={setEnabled} 
                        className="data-[state=checked]:bg-indigo-600"
                    />
                </CardHeader>
                
                {enabled && (
                    <CardContent className="pt-6 space-y-8">
                        <div className="space-y-4">
                            <Label className="text-base font-semibold text-slate-900">Reply Mechanism</Label>
                            <RadioGroup 
                                value={replyType} 
                                onValueChange={(val: "STATIC" | "AI") => setReplyType(val)}
                                className="grid md:grid-cols-2 gap-4"
                            >
                                <div>
                                    <RadioGroupItem value="STATIC" id="static" className="peer sr-only" />
                                    <Label
                                        htmlFor="static"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:bg-indigo-50 [&:has([data-state=checked])]:border-indigo-600 cursor-pointer"
                                    >
                                        <MessageSquareText className="mb-3 h-6 w-6" />
                                        <span className="font-semibold block text-center">Static Message</span>
                                        <span className="text-xs font-normal text-muted-foreground text-center mt-1">
                                            Send the exact same text automatically to every new lead.
                                        </span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="AI" id="ai" className="peer sr-only" />
                                    <Label
                                        htmlFor="ai"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:bg-indigo-50 [&:has([data-state=checked])]:border-indigo-600 cursor-pointer"
                                    >
                                        <Bot className="mb-3 h-6 w-6 text-indigo-500" />
                                        <span className="font-semibold block text-center">AI Smart Agent</span>
                                        <span className="text-xs font-normal text-muted-foreground text-center mt-1">
                                            Use AI to dynamically read constraints and write custom replies.
                                        </span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {replyType === 'STATIC' && (
                            <div className="space-y-3 bg-slate-50 p-5 rounded-lg border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                                <Label className="text-sm font-semibold text-slate-900">Static Welcome Message</Label>
                                <p className="text-xs text-slate-500">This exact message will be dispatched immediately when a new number texts you for the first time.</p>
                                <Textarea 
                                    className="min-h-[120px] font-medium" 
                                    value={staticMessage}
                                    onChange={e => setStaticMessage(e.target.value)}
                                    placeholder="Thank you for your message! Our team will get back to you shortly."
                                />
                            </div>
                        )}

                        {replyType === 'AI' && (
                            <div className="space-y-5 bg-indigo-50/50 p-5 rounded-lg border border-indigo-100 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <Bot className="w-4 h-4 text-indigo-600" />
                                        AI System Prompt
                                    </Label>
                                    <p className="text-xs text-slate-500">
                                        Tell the AI exactly how it should behave, what its goals are, and how it should speak to customers. It will automatically read previous message history to stay in context.
                                    </p>
                                    <Textarea 
                                        className="min-h-[220px] font-mono text-xs bg-white" 
                                        value={aiPrompt}
                                        onChange={e => setAiPrompt(e.target.value)}
                                        placeholder="You are a helpful assistant..."
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-900">AI Logic Model</Label>
                                    <div className="max-w-xs">
                                        <Input 
                                            value={aiModel} 
                                            onChange={e => setAiModel(e.target.value)} 
                                            className="bg-white" 
                                            placeholder="gpt-4o-mini"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">Default: gpt-4o-mini. Also supports gpt-4o, gpt-3.5-turbo.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

        </div>
    );
}
