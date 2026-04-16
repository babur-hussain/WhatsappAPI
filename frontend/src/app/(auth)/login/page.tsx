"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            const data = await res.json();

            setIsLoading(false);
            if (data.success) {
                toast({ title: "Welcome back!", description: "Successfully logged in." });
                document.cookie = `accessToken=${idToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

                if (data.data.onboardingComplete) {
                    router.push('/leads');
                } else {
                    router.push('/onboarding');
                }
            } else {
                toast({ title: "Error", description: data.error?.message || "Invalid credentials.", variant: "destructive" });
            }
        } catch (err: any) {
            setIsLoading(false);
            // Ignore console.error(err) here because Next.js will intercept it and show a massive red Dev Overlay 
            // for standard authentication failures like "invalid credentials".
            console.log("Login failed:", err.message || err);
            
            let errorMessage = "Failed to connect to server.";
            if (err.code === 'auth/invalid-credential') {
                errorMessage = "Invalid email or password. Please try again.";
            } else if (err.message) {
                errorMessage = err.message; // fallback to firebase error message
            }

            toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
        }
    };

    return (
        <Card className="w-full max-w-md shadow-lg border-slate-200">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Sign in to LoomiFlow</CardTitle>
                <CardDescription className="text-slate-500">
                    Enter your email and password to access your dashboard
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="font-medium">Email Address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="factory@example.com"
                            required
                            className="w-full transition-colors"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="font-medium">Password</Label>
                            <Link href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full transition-colors"
                            disabled={isLoading}
                        />
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-center gap-2 border-t pt-4">
                <div className="text-sm text-slate-500">
                    Don't have a factory account?
                </div>
                <Link href="/register" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                    Create one now
                </Link>
            </CardFooter>
        </Card>
    );
}
