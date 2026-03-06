"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const factoryName = formData.get("factoryName") as string;
        const ownerName = formData.get("ownerName") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const password = formData.get("password") as string;

        try {
            let userCredential;
            try {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: ownerName });
            } catch (firebaseErr: any) {
                // If the backend crashed previously, Firebase might have created the user
                // but PostgreSQL didn't. We catch the "already in use" error, authenticate them,
                // and proceed with the payload so the backend can finish creating the Factory DB.
                if (firebaseErr.code === 'auth/email-already-in-use') {
                    userCredential = await signInWithEmailAndPassword(auth, email, password);
                } else {
                    throw firebaseErr; // Re-throw other errors
                }
            }
            const idToken = await userCredential.user.getIdToken();

            const res = await fetch('http://localhost:8000/api/v1/auth/sync', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ factoryName, ownerName, phone })
            });
            const data = await res.json();

            setIsLoading(false);
            if (data.success) {
                toast({
                    title: "Factory Account Created",
                    description: `Welcome aboard, ${ownerName}! Redirecting to setup...`
                });
                document.cookie = `accessToken=${idToken}; path=/`;
                router.push('/onboarding');
            } else {
                toast({ title: "Registration Failed", description: data.error?.message || "Please check your inputs.", variant: "destructive" });
            }
        } catch (err: any) {
            setIsLoading(false);
            console.error(err);
            toast({ title: "Error", description: err.message || "Failed to create account.", variant: "destructive" });
        }
    };

    return (
        <Card className="w-full max-w-lg shadow-xl border-slate-200">
            <CardHeader className="space-y-1 text-center border-b pb-6">
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Create Factory Account</CardTitle>
                <CardDescription className="text-slate-500">
                    Start automating your WhatsApp sales today
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="factoryName" className="font-medium">Factory Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="factoryName"
                                name="factoryName"
                                placeholder="Acme Textiles Ltd."
                                required
                                className="w-full"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerName" className="font-medium">Owner Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="ownerName"
                                name="ownerName"
                                placeholder="John Doe"
                                required
                                className="w-full"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-medium">Email Address <span className="text-red-500">*</span></Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="john@acmetextiles.com"
                                required
                                className="w-full"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="font-medium">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="+1234567890"
                                className="w-full"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="font-medium">Password <span className="text-red-500">*</span></Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-slate-500">Must be at least 8 characters long</p>
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors py-6 text-md mt-4" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Create Factory Account"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-center gap-2 border-t pt-5 bg-slate-50 rounded-b-lg">
                <div className="text-sm text-slate-500">
                    Already have an account?
                </div>
                <Link href="/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                    Sign in instead
                </Link>
            </CardFooter>
        </Card>
    );
}
