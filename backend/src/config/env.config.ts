import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env explicitly for local runtime. Hosting environments will inject these directly.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'staging']).default('development'),
    PORT: z.string().transform(Number).default('8000'),
    SOCKET_PORT: z.string().transform(Number).default('5001'),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    FIREBASE_PROJECT_ID: z.string(),
    FIREBASE_PRIVATE_KEY: z.string(),
    FIREBASE_CLIENT_EMAIL: z.string(),
    META_ACCESS_TOKEN: z.string().optional(),
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    ENCRYPTION_KEY: z.string().length(64, 'Encryption key must be exactly 32 bytes (64 hex characters)'),
});

const validateEnv = () => {
    try {
        const _env = envSchema.parse(process.env);

        // Parse CORS origins if it's a comma-separated string
        const parsedOrigins = _env.CORS_ORIGINS.includes(',')
            ? _env.CORS_ORIGINS.split(',').map(o => o.trim())
            : [_env.CORS_ORIGINS];

        return {
            ..._env,
            CORS_ORIGINS: parsedOrigins,
            isProd: _env.NODE_ENV === 'production',
            isDev: _env.NODE_ENV === 'development',
            isStaging: _env.NODE_ENV === 'staging',
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Invalid environment variables:', error.format());
            process.exit(1);
        }
        throw error;
    }
};

export const env = validateEnv();