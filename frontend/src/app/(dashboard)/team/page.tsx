import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeamPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team Management</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Factory Users</CardTitle>
                    <CardDescription>Manage sales agents and factory administrators.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="py-8 text-center text-slate-500">
                        Team management features coming soon.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
