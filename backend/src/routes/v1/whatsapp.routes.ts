import { Router, Response } from 'express';
import { protect } from '../../middlewares/firebase-auth.middleware';
import * as whatsappController from '../../controllers/whatsapp.controller';
import prisma from '../../config/database';
import { decrypt } from '../../utils/crypto.util';

const router = Router();

// TEMP diagnose - no auth
router.get('/diagnose', async (req: any, res: Response) => {
    const results: any = { tests: {} };
    try {
        const factory = await prisma.factory.findFirst({
            where: { isWhatsappConnected: true },
            select: {
                id: true, factoryName: true, whatsappPhoneNumberId: true,
                whatsappAccessToken: true, whatsappBusinessAccountId: true,
                whatsappNumber: true, isWhatsappConnected: true,
            },
        });
        if (!factory) return res.status(404).json({ error: 'No connected factory' });

        let accessToken: string;
        try {
            accessToken = decrypt(factory.whatsappAccessToken!);
            results.decryption = { success: true, tokenPreview: `${accessToken.substring(0, 15)}...${accessToken.substring(accessToken.length - 10)}`, tokenLength: accessToken.length };
        } catch (err: any) {
            return res.json({ decryption: { success: false, error: err.message } });
        }

        // debug_token
        const debugRes = await fetch(`https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}`, { headers: { Authorization: `Bearer ${accessToken}` } });
        results.tests.debug_token = { httpStatus: debugRes.status, response: await debugRes.json() };

        // send test
        const sendRes = await fetch(`https://graph.facebook.com/v21.0/${factory.whatsappPhoneNumberId}/messages`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: '916264134364', type: 'template', template: { name: 'hello_world', language: { code: 'en_US' } } }),
        });
        results.tests.send_message = { httpStatus: sendRes.status, response: await sendRes.json() };

        // diagnosis summary
        const d = results.tests.debug_token?.response?.data;
        if (d) {
            results.diagnosis = {
                tokenValid: d.is_valid, tokenType: d.type, appId: d.app_id,
                expiresAt: d.expires_at === 0 ? 'Never' : new Date(d.expires_at * 1000).toISOString(),
                scopes: d.scopes || [],
                granularScopes: d.granular_scopes || [],
                hasMessaging: d.scopes?.includes('whatsapp_business_messaging'),
            };
        }
        res.json(results);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Protected routes
router.use(protect);
router.post('/verify', whatsappController.verifyWhatsApp);
router.put('/connect', whatsappController.connectWhatsApp);
router.get('/status', whatsappController.getWhatsAppStatus);
router.post('/disconnect', whatsappController.disconnectWhatsApp);

export default router;
