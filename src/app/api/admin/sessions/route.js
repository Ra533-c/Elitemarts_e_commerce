import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';

// Get pending payment sessions for admin verification
export async function GET(request) {
    try {
        const client = await clientPromise;
        const db = client.db('elitemarts');

        // Get all pending/submitted payment sessions
        const sessions = await db.collection('payment_sessions')
            .find({
                paymentStatus: { $in: ['pending', 'submitted'] },
                orderId: null // Not yet converted to order
            })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({
            success: true,
            sessions: sessions.map(s => ({
                sessionId: s.sessionId,
                customerName: s.customerData.name,
                phone: s.customerData.phone,
                amount: s.qrCode.amount,
                paymentStatus: s.paymentStatus,
                createdAt: s.createdAt,
                expiresAt: s.expiresAt
            }))
        });

    } catch (error) {
        console.error('Failed to fetch sessions:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}

// Verify or reject payment session
export async function POST(request) {
    try {
        const { sessionId, action } = await request.json(); // action: 'verify' or 'reject'

        if (!sessionId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        const session = await db.collection('payment_sessions').findOne({ sessionId });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (action === 'verify') {
            // Update session to verified
            await db.collection('payment_sessions').updateOne(
                { sessionId },
                {
                    $set: {
                        paymentStatus: 'verified',
                        verifiedAt: new Date(),
                        verifiedBy: 'admin'
                    }
                }
            );

            return NextResponse.json({
                success: true,
                message: 'Payment verified successfully'
            });

        } else if (action === 'reject') {
            // Update session to failed
            await db.collection('payment_sessions').updateOne(
                { sessionId },
                {
                    $set: {
                        paymentStatus: 'failed',
                        rejectedAt: new Date(),
                        rejectedBy: 'admin'
                    }
                }
            );

            return NextResponse.json({
                success: true,
                message: 'Payment rejected'
            });

        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
