import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        let credential;

        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            // Prefer the base64 encoded service account JSON if provided
            let base64String = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim();
            
            // Strip any surrounding quotes if Railway added them
            if ((base64String.startsWith('"') && base64String.endsWith('"')) ||
                (base64String.startsWith("'") && base64String.endsWith("'"))) {
                base64String = base64String.slice(1, -1);
            }

            const serviceAccountJson = Buffer.from(base64String, 'base64').toString('utf-8');
            
            // Log first 100 chars and last 50 chars to debug JSON string
            console.log('Decoded JSON starts with:', serviceAccountJson.substring(0, 100));
            console.log('Decoded JSON ends with:', serviceAccountJson.substring(serviceAccountJson.length - 50));
            
            credential = admin.credential.cert(JSON.parse(serviceAccountJson));
            console.log('Firebase Admin initialized using Base64 Service Account');
        } else {
            // Fall back to individual variables
            let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

            // Strip surrounding quotes if present
            if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
                (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
                privateKey = privateKey.slice(1, -1);
            }

            // Replace literal \n (two characters: backslash + n) with actual newlines
            privateKey = privateKey.split('\\n').join('\n');

            credential = admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey,
            });
            console.log('Firebase Admin initialized using individual env vars');
        }

        admin.initializeApp({
            credential,
        });
        
    } catch (error) {
        console.error('Firebase Admin initialization error', error);
    }
}

export const firebaseAdmin = admin;
export const auth = admin.auth();
