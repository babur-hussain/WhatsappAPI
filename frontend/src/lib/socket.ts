import { io } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_API_URL || 'https://whatsappapi.lfvs.in';

function getCookie(name: string): string {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : '';
}

export const socket = io(URL, {
    auth: () => ({
        token: getCookie('accessToken'),
        factoryId: getCookie('factoryId'),
    }),
    autoConnect: false, // Connect manually when app loads/authenticates
});
