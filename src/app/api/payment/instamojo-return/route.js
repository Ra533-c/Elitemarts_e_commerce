import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const paymentId = searchParams.get('payment_id');
        const paymentStatus = searchParams.get('payment_status');

        if (!sessionId) {
            return NextResponse.redirect(new URL('/?error=no_session', request.url));
        }

        // If payment was successful on Instamojo
        if (paymentStatus === 'Credit' && paymentId) {
            const client = await clientPromise;
            const db = client.db('elitemarts');

            // Update session to verified
            await db.collection('payment_sessions').updateOne(
                { sessionId },
                {
                    $set: {
                        paymentStatus: 'verified',
                        paymentId,
                        verifiedAt: new Date(),
                        verifiedBy: 'instamojo'
                    }
                }
            );

            // Redirect to success page with session ID
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            return NextResponse.redirect(
                `${appUrl}/?payment=success&sessionId=${sessionId}`
            );
        }

        // Payment failed or cancelled
        return NextResponse.redirect(new URL('/?error=payment_failed', request.url));

    } catch (error) {
        console.error('Instamojo return error:', error);
        return NextResponse.redirect(new URL('/?error=unknown', request.url));
    }
}
