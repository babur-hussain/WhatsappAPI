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
    const isPublicRoute = isAuthRoute || pathname.startsWith('/onboarding');

    // If no token and trying to access any non-public route, redirect to login
    if (!token && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If already logged in and hitting auth pages, redirect to dashboard
    if (token && isAuthRoute) {
        return NextResponse.redirect(new URL('/leads', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
