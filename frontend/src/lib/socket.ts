import { io } from 'socket.io-client';

// In production, this would be an env var
const URL = 'https://whatsappapi.lfvs.in';

// Replace with logic that fetches valid token when implementing full auth
const token = 'test';
// Replace with logic to grab factoryId when authenticated
const factoryId = 'mock-factory-id';

export const socket = io(URL, {
    auth: {
        token,
        factoryId
    },
    autoConnect: false // Connect manually when app loads/authenticates
});
