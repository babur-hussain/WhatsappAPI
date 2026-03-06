import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ status: 'Tracking API Active' });
}

export async function POST() {
    return NextResponse.json({ status: 'Event Recorded' });
}
