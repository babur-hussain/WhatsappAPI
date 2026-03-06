import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../config/logger';

// Load env variable
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    logger.error('❌ DATABASE_URL is not defined in the environment. Cannot perform backup.');
    process.exit(1);
}

// Directory for backups
const backupDir = path.resolve(__dirname, '../../../backups');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFilename = `loomiflow-db-backup-${timestamp}.sql`;
const backupFilePath = path.join(backupDir, backupFilename);

logger.info(`🔄 Starting database backup... Destination: ${backupFilePath}`);

// Extract Postgres credentials out of the Prisma style Connection String
// Example format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
let pgUrl = DATABASE_URL;

// If it starts with `postgresql://` swap it temporarily for standard pg_dump `postgres://` dialect compatibility in some environments if needed (usually fine)
if (pgUrl.startsWith('postgresql://')) {
    // pg_dump supports URL natively
    // but Prisma schema URL parameters sometimes confuse pg_dump
    pgUrl = pgUrl.split('?')[0];
}

const dumpCommand = `pg_dump "${pgUrl}" -F c -f "${backupFilePath}"`;

exec(dumpCommand, (error, stdout, stderr) => {
    if (error) {
        logger.error(`❌ Backup failed: ${error.message}`);
        logger.error(`stderr: ${stderr}`);
        return;
    }

    logger.info(`✅ Database backup successfully saved to ${backupFilePath}`);

    // Optional: Cleanup old backups (keep last 7)
    fs.readdir(backupDir, (err, files) => {
        if (err) return logger.error('❌ Failed to read backup directory for cleanup', err);

        const sqlFiles = files
            .filter(f => f.endsWith('.sql'))
            .sort()
            .reverse();

        if (sqlFiles.length > 7) {
            const filesToDelete = sqlFiles.slice(7);
            filesToDelete.forEach(file => {
                const filePath = path.join(backupDir, file);
                try {
                    fs.unlinkSync(filePath);
                    logger.info(`🗑️ Deleted old backup: ${file}`);
                } catch (delErr) {
                    logger.error(`❌ Failed to delete old backup: ${file}`, delErr);
                }
            });
        }
    });
});
