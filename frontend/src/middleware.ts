import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Static assets, specific api routes, etc.
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.match(/\.(.*)$/)) {
        return NextResponse.next();
    }

    const token = request.cookies.get('accessToken')?.value;
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isOnboardingRoute = pathname.startsWith('/onboarding');
    const isDashboardRoute = pathname === '/' ||
        pathname.startsWith('/leads') ||
        pathname.startsWith('/catalogs') ||
        pathname.startsWith('/team') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/analytics');

    // If no token and trying to access protected routes
    if (!token && (isDashboardRoute || isOnboardingRoute)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If token exists, we can optionally enforce onboarding.
    // However, since we can't easily fetch the DB from edge without passing cookies carefully,
    // we lean on the onboarding page itself (and the client UI) to guide them. 
    // To strictly protect dashboard, we can attempt a backend ping if needed,
    // but a common Next.js pattern is to let client components read `me` and redirect if isOnboardingComplete is false.
    // For now, if they are logged in and hit login/register, push to leads
    if (token && isAuthRoute) {
        return NextResponse.redirect(new URL('/leads', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
