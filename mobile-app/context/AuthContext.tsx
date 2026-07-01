import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                // Get and store the token for API calls
                const token = await user.getIdToken();
                await SecureStore.setItemAsync('accessToken', token);
            } else {
                setUser(null);
                await SecureStore.deleteItemAsync('accessToken');
            }
            setIsLoading(false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'login';

        if (!user && !inAuthGroup) {
            // Redirect to login
            router.replace('/login');
        } else if (user && inAuthGroup) {
            // Redirect to tabs
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
