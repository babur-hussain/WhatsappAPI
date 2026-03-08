"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SmartRepliesPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Smart Replies</h1>
                <p className="text-slate-500 mt-2">
                    Manage your automated and AI-powered smart replies for customer conversations.
                </p>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>
                        Set up your smart replies rules here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-lg">
                        <p className="text-slate-500 font-medium">Coming soon / Under construction</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
