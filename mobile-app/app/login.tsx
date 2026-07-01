import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            // The AuthContext will automatically redirect to (tabs)
        } catch (error: any) {
            console.error('Login error', error);
            Alert.alert('Login Failed', error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-slate-50 dark:bg-slate-950"
        >
            {/* Background Decorative Elements */}
            <View className="absolute top-[-10%] left-[-20%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl opacity-50 dark:opacity-50 opacity-100" />
            <View className="absolute bottom-[-10%] right-[-20%] w-96 h-96 bg-violet-600/20 rounded-full blur-3xl opacity-50 dark:opacity-50 opacity-100" />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="mb-12">
                    <Text className="text-5xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                        Loomi<Text className="text-indigo-600 dark:text-indigo-400">Flow</Text>
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
                        Sign in to manage your customer conversations and workflow.
                    </Text>
                </View>

                {/* Form */}
                <View className="space-y-5">
                    <View>
                        <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">Email Address</Text>
                        <View className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm shadow-slate-100 dark:shadow-none">
                            <TextInput
                                className="text-slate-900 dark:text-white px-5 py-4 text-base"
                                placeholder="Email Address"
                                placeholderTextColor="#94a3b8"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                selectionColor="#818cf8"
                            />
                        </View>
                    </View>

                    <View className="mt-5">
                        <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">Password</Text>
                        <View className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm shadow-slate-100 dark:shadow-none">
                            <TextInput
                                className="text-slate-900 dark:text-white px-5 py-4 text-base"
                                placeholder="••••••••"
                                placeholderTextColor="#94a3b8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                selectionColor="#818cf8"
                            />
                        </View>
                    </View>

                    {/* Forgot Password Link */}
                    <TouchableOpacity className="mt-4 self-end">
                        <Text className="text-indigo-600 dark:text-indigo-400 font-medium">Forgot password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                        className="bg-indigo-600 dark:bg-indigo-500 py-4 rounded-2xl mt-8 items-center shadow-lg shadow-indigo-500/30"
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
