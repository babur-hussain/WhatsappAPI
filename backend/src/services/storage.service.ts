import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

type UploadFolder = 'catalogs' | 'media' | 'templates' | 'avatars';

export class StorageService {
    private s3Client: S3Client;
    private bucketName: string;
    private region: string;

    constructor() {
        this.bucketName = process.env.AWS_S3_BUCKET || '';
        this.region = process.env.AWS_REGION || 'us-east-1';

        this.s3Client = new S3Client({
            region: this.region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }

    /**
     * Returns the canonical public URL for an S3 object key.
     * Format: https://<bucket>.s3.<region>.amazonaws.com/<key>
     */
    private buildPublicUrl(key: string): string {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }

    /**
     * Extract the S3 object key from a full S3 URL.
     */
    private extractKey(fileUrl: string): string {
        const url = new URL(fileUrl);
        // pathname starts with '/', strip it
        return url.pathname.replace(/^\//, '');
    }

    /**
     * Upload a file buffer to S3 under factories/<factoryId>/catalogs/<uuid>.<ext>
     * Used by the catalog controller (maintains backwards compatibility).
     */
    public async uploadFile(file: Express.Multer.File, factoryId: string): Promise<string> {
        if (!this.bucketName) throw new Error('AWS_S3_BUCKET is not configured');

        const extension = path.extname(file.originalname);
        const key = `factories/${factoryId}/catalogs/${uuidv4()}${extension}`;

        return this._upload(file.buffer, key, file.mimetype);
    }

    /**
     * Upload any media file to S3 under <folder>/<factoryId>/<uuid>.<ext>
     * Used by the general-purpose media upload endpoint.
     */
    public async uploadMedia(
        file: Express.Multer.File,
        factoryId: string,
        folder: UploadFolder = 'media',
    ): Promise<{ url: string; key: string }> {
        if (!this.bucketName) throw new Error('AWS_S3_BUCKET is not configured');

        const extension = path.extname(file.originalname) || '';
        const key = `${folder}/${factoryId}/${uuidv4()}${extension}`;

        const url = await this._upload(file.buffer, key, file.mimetype);
        return { url, key };
    }

    /**
     * Internal helper that performs the actual S3 PutObject command and returns the public URL.
     */
    private async _upload(body: Buffer, key: string, contentType: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: body,
            ContentType: contentType,
        });

        await this.s3Client.send(command);
        return this.buildPublicUrl(key);
    }

    /**
     * Generate a presigned GET URL for a private S3 object.
     * @param keyOrUrl  Either a raw S3 key (e.g. "media/factory1/abc.jpg") or a full S3 URL.
     * @param expiresIn TTL in seconds (default: 3600 = 1 hour).
     */
    public async getSignedUrl(keyOrUrl: string, expiresIn = 3600): Promise<string> {
        const key = keyOrUrl.startsWith('http') ? this.extractKey(keyOrUrl) : keyOrUrl;

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return getSignedUrl(this.s3Client as any, command, { expiresIn });
    }

    /**
     * Delete a file from S3 given its full URL or key.
     */
    public async deleteFile(fileUrlOrKey: string): Promise<void> {
        if (!this.bucketName) throw new Error('AWS_S3_BUCKET is not configured');

        const key = fileUrlOrKey.startsWith('http')
            ? this.extractKey(fileUrlOrKey)
            : fileUrlOrKey;

        if (!key) throw new Error('Could not determine S3 object key');

        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        await this.s3Client.send(command);
    }
}

export const storageService = new StorageService();
