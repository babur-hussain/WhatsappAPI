import { firebaseAdmin } from '../config/firebase';
import prisma from '../config/database';

async function prune() {
    try {
        console.log("Fetching Firebase users...");
        let pageToken;
        const auth = firebaseAdmin.auth();
        const MAX_RESULTS = 1000;
        
        do {
            const listUsersResult = await auth.listUsers(MAX_RESULTS, pageToken);
            pageToken = listUsersResult.pageToken;
            
            for (const fbUser of listUsersResult.users) {
                if (!fbUser.email) continue;
                
                // Exclude super admins just in case
                if (fbUser.email === process.env.SUPER_ADMIN_EMAIL) {
                    console.log(`Skipping super admin: ${fbUser.email}`);
                    continue;
                }

                // Check if user exists in Postgres
                const pgUser = await prisma.user.findUnique({ where: { email: fbUser.email } });
                const pgFactory = await prisma.factory.findUnique({ where: { email: fbUser.email } });
                
                if (!pgUser && !pgFactory) {
                    console.log(`User ${fbUser.email} (${fbUser.uid}) not found in Postgres. Deleting from Firebase...`);
                    await auth.deleteUser(fbUser.uid);
                    console.log(`Deleted ${fbUser.email}.`);
                } else {
                    console.log(`User ${fbUser.email} exists in Postgres. Keeping.`);
                }
            }
        } while (pageToken);
        
        console.log("Done pruning orphaned users.");
    } catch (e) {
        console.error("Error pruning users:", e);
    }
}

prune().catch(console.error).finally(() => process.exit(0));
