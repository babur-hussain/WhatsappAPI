import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Factory Configuration</CardTitle>
                    <CardDescription>Manage your business profile and WhatsApp configuration.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="py-8 text-center text-slate-500">
                        Configuration settings coming soon.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
