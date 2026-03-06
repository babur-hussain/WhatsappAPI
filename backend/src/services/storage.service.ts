import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class StorageService {
    private s3Client: S3Client;
    private bucketName: string;
    private endpoint: string;

    constructor() {
        this.bucketName = process.env.STORAGE_BUCKET_NAME || '';
        this.endpoint = process.env.STORAGE_ENDPOINT || '';

        this.s3Client = new S3Client({
            region: process.env.STORAGE_REGION || 'us-east-1',
            endpoint: this.endpoint,
            credentials: {
                accessKeyId: process.env.STORAGE_ACCESS_KEY || '',
                secretAccessKey: process.env.STORAGE_SECRET_KEY || '',
            },
            forcePathStyle: true, // Needed for many S3-compatible services like Minio/DigitalOcean
        });
    }

    /**
     * Upload a file buffer to S3 compatible storage
     */
    public async uploadFile(file: Express.Multer.File, factoryId: string): Promise<string> {
        if (!this.bucketName) throw new Error('Storage bucket not configured');

        const extension = path.extname(file.originalname);
        const key = `factories/${factoryId}/catalogs/${uuidv4()}${extension}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            // ACL: 'public-read' // Uncomment if you want files to be public directly
        });

        await this.s3Client.send(command);

        // Construct the public URL (assuming endpoint is the base URL for public access)
        // Note: depending on the provider, the public URL format might differ.
        // DigitalOcean: https://<bucket-name>.<region>.digitaloceanspaces.com/<key>
        // AWS: https://<bucket-name>.s3.<region>.amazonaws.com/<key>
        // We construct a generic one here:
        const fileUrl = `${this.endpoint}/${this.bucketName}/${key}`;
        return fileUrl;
    }

    /**
     * Delete a file from S3 compatible storage given its full URL
     */
    public async deleteFile(fileUrl: string): Promise<void> {
        if (!this.bucketName) throw new Error('Storage bucket not configured');

        try {
            // Extract the key from the file URL
            const urlParts = new URL(fileUrl);
            // Example basic extraction (this varies depending on URL structure of endpoint vs AWS)
            // Assuming URL format: endpoint/bucket/key
            const keyPrefix = `/${this.bucketName}/`;
            const keyIndex = urlParts.pathname.indexOf(keyPrefix);
            let key = '';

            if (keyIndex !== -1) {
                key = urlParts.pathname.substring(keyIndex + keyPrefix.length);
            } else {
                // Fallback for AWS format: bucket.s3.region.amazonaws.com/key
                key = urlParts.pathname.substring(1);
            }

            if (!key) throw new Error('Could not parse file key from URL');

            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            await this.s3Client.send(command);
        } catch (error) {
            console.error('Failed to delete file from storage', error);
            throw error;
        }
    }
}

export const storageService = new StorageService();
