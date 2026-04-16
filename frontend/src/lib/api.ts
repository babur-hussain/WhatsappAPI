/**
 * Shared API utility for LoomiFlow frontend.
 * Handles authentication, rate limiting (429), and common error responses.
 */

export function getAuthHeaders(): Record<string, string> {
    const token = typeof document !== 'undefined'
        ? document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/)?.[1] || ''
        : '';
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://whatsappapi.lfvs.in';

/**
 * Enhanced fetch wrapper that handles common API error scenarios:
 * - 429 Too Many Requests → shows user-friendly rate limit message
 * - 401 Unauthorized → returns null (caller can redirect)
 * - Network errors → returns null with optional toast
 */
export async function apiFetch<T = any>(
    url: string,
    options?: RequestInit & { showRateLimit?: boolean }
): Promise<{ data: T | null; error: string | null; status: number }> {
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...(options?.headers || {}),
            },
        });

        if (res.status === 429) {
            return {
                data: null,
                error: 'Too many requests. Please wait a moment and try again.',
                status: 429,
            };
        }

        if (res.status === 401) {
            return { data: null, error: 'Session expired. Please log in again.', status: 401 };
        }

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return {
                data: null,
                error: errorData?.error?.message || errorData?.message || `Request failed (${res.status})`,
                status: res.status,
            };
        }

        const json = await res.json();
        return { data: json.data ?? json, error: null, status: res.status };
    } catch (e: any) {
        return {
            data: null,
            error: e.message || 'Network error. Please check your connection.',
            status: 0,
        };
    }
}
