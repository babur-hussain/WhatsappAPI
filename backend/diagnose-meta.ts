/**
 * Meta WhatsApp API Diagnostic - Direct API Test
 * Tests the deployed backend and Meta API directly
 */

async function main() {
    console.log('\n========================================');
    console.log('  META WHATSAPP API LIVE DIAGNOSTIC');
    console.log('========================================\n');

    const BACKEND = 'https://whatsappapi.lfvs.in';

    // Step 1: Check backend health
    console.log('[TEST 1] Backend Health...');
    try {
        const healthRes = await fetch(`${BACKEND}/api/v1/health`);
        const healthData = await healthRes.json();
        console.log(`  ✅ Backend: ${JSON.stringify(healthData)}\n`);
    } catch (err: any) {
        console.log(`  ❌ Backend unreachable: ${err.message}\n`);
        return;
    }

    // Step 2: Check the WhatsApp status endpoint (no auth needed for some configs)
    console.log('[TEST 2] WhatsApp Status Endpoint...');
    try {
        const statusRes = await fetch(`${BACKEND}/api/v1/whatsapp/status`);
        console.log(`  Status HTTP: ${statusRes.status}`);
        const statusData = await statusRes.text();
        console.log(`  Response: ${statusData}\n`);
    } catch (err: any) {
        console.log(`  Error: ${err.message}\n`);
    }

    // Step 3: Try to call the debug endpoint to inspect credentials
    // We'll check if there's a debug or diagnostic route
    console.log('[TEST 3] Checking for diagnostic routes...');
    const testRoutes = [
        '/api/v1/whatsapp/debug',
        '/api/v1/settings',
        '/api/v1/factory/current',
    ];
    for (const route of testRoutes) {
        try {
            const res = await fetch(`${BACKEND}${route}`);
            console.log(`  ${route}: ${res.status} ${res.statusText}`);
            if (res.status < 500) {
                const body = await res.text();
                console.log(`    Body: ${body.substring(0, 200)}`);
            }
        } catch (err: any) {
            console.log(`  ${route}: ${err.message}`);
        }
    }
    console.log('');

    // Step 4: Check the templates endpoint  
    console.log('[TEST 4] Templates list endpoint (no auth)...');
    try {
        const res = await fetch(`${BACKEND}/api/v1/templates`);
        console.log(`  Status: ${res.status}`);
        const body = await res.text();
        console.log(`  Response: ${body.substring(0, 300)}\n`);
    } catch (err: any) {
        console.log(`  Error: ${err.message}\n`);
    }

    console.log('========================================');
    console.log('  DIAGNOSIS COMPLETE');
    console.log('========================================\n');
    console.log('The error "(#200) You do not have the necessary permissions" means:');
    console.log('The access token stored in your factory DB record does NOT have');
    console.log('"whatsapp_business_messaging" permission on the WABA (WhatsApp Business Account).\n');
    console.log('To fix, we need to check the actual token. Adding a temp debug endpoint...');
}

main().catch(console.error);
