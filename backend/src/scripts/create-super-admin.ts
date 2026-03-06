import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load main .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const firebaseUid = process.env.SUPER_ADMIN_FIREBASE_UID;

    if (!email || !firebaseUid) {
        console.error('❌ Missing required environment variables:');
        console.error('  SUPER_ADMIN_EMAIL or SUPER_ADMIN_FIREBASE_UID is not set.');
        process.exit(1);
    }

    console.log(`Checking for Super Admin with email: ${email}`);

    const existingAdmin = await prisma.user.findUnique({
        where: { email }
    });

    if (existingAdmin) {
        console.log('✅ Super Admin already exists.');

        // Ensure the role is SUPER_ADMIN and firebaseUid is correct just in case
        await prisma.user.update({
            where: { email },
            data: {
                role: 'SUPER_ADMIN',
                firebaseUid
            }
        });
        console.log('  Updated role to SUPER_ADMIN and ensured UID match.');
        return;
    }

    console.log('Creating new Super Admin...');

    await prisma.user.create({
        data: {
            email,
            firebaseUid,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            // Note: factoryId is null
        }
    });

    console.log('✅ Super Admin created successfully.');
}

main()
    .catch((e) => {
        console.error('❌ Error creating Super Admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
