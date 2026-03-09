import crypto from 'crypto';
import { env } from '../config/env.config';
import { logger } from '../config/logger';

const ALGORITHM = 'aes-256-gcm';
// Convert the 64-character hex string into a 32-byte Buffer
const SECRETE_KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');

/**
 * Encrypts a plain text string using AES-256-GCM
 * @param text The plain text token/string to encrypt
 * @returns Encrypted string in the format of "iv:authTag:encryptedData" in hex format
 */
export const encrypt = (text: string): string => {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, SECRETE_KEY, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        // Return concatenated iv : auth_tag : encrypted_data
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
        logger.error('Encryption failed', error);
        throw new Error('Encryption failed');
    }
};

/**
 * Decrypts a secure string back to plain text
 * @param encryptedText The encrypted text returned by the encrypt() function
 * @returns The original decrypted plain text string
 */
export const decrypt = (encryptedText: string): string => {
    try {
        const parts = encryptedText.split(':');
        
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted text format. Expected iv:authTag:encryptedData');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedData = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, SECRETE_KEY, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        logger.error('Decryption failed', error);
        throw new Error('Decryption failed');
    }
};

/**
 * Creates a deterministic SHA-256 hash of a phone number for dedup/lookup.
 * Normalizes by stripping all non-digit characters before hashing.
 * @param phone The raw phone number string
 * @returns Hex-encoded SHA-256 hash
 */
export const hashPhone = (phone: string): string => {
    const normalized = phone.replace(/\D/g, '');
    return crypto.createHash('sha256').update(normalized).digest('hex');
};
