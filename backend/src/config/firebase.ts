import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

        // Debug: log the first 50 chars to verify format
        console.log('FIREBASE_PRIVATE_KEY starts with:', privateKey.substring(0, 50));
        console.log('FIREBASE_PRIVATE_KEY length:', privateKey.length);

        // Strip surrounding quotes if present
        if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
            (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
            privateKey = privateKey.slice(1, -1);
        }

        // Replace literal \n (two characters: backslash + n) with actual newlines
        privateKey = privateKey.split('\\n').join('\n');

        console.log('Processed key starts with:', privateKey.substring(0, 40));

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey,
            }),
        });
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Firebase Admin initialization error', error);
    }
}

export const firebaseAdmin = admin;
export const auth = admin.auth();
