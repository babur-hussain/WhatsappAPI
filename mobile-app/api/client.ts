import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { auth } from '../lib/firebase';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://whatsappapi.lfvs.in';

export const apiClient = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding the auth token
apiClient.interceptors.request.use(
    async (config) => {
        let token = await SecureStore.getItemAsync('accessToken');
        
        // If token is found, check if Firebase can give us a fresh one just in case
        if (auth.currentUser) {
            const fbToken = await auth.currentUser.getIdToken();
            await SecureStore.setItemAsync('accessToken', fbToken);
            token = fbToken;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // The backend uses cookies for token, but we will send it in Authorization header 
            // We need to update the backend middleware if it doesn't support Bearer token.
            // Let's also send it in Cookie header just in case backend strictly requires it.
            config.headers.Cookie = `accessToken=${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
