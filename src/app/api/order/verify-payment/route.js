import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';

// Admin endpoint to verify or reject payments
export async function POST(request) {
    try {
        const data = await request.json();
        const { orderId, action, adminName } = data;

        if (!orderId || !action) {
            return NextResponse.json(
                { error: 'Order ID and action (verify/reject) required' },
                { status: 400 }
            );
        }

        if (action !== 'verify' && action !== 'reject') {
            return NextResponse.json(
                { error: 'Action must be either "verify" or "reject"' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        // Get the order first to check if it exists
        const order = await db.collection('orders').findOne({
            orderId: orderId.toUpperCase()
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const updateFields = {
            updatedAt: new Date(),
            verifiedBy: adminName || 'Admin',
        };

        if (action === 'verify') {
            updateFields.paymentStatus = 'verified';
            updateFields.paymentVerifiedAt = new Date();
            updateFields.status = 'paid';
        } else {
            updateFields.paymentStatus = 'failed';
            updateFields.paymentFailedAt = new Date();
            updateFields.paymentFailedReason = 'Payment not received or incorrect amount';
        }

        const result = await db.collection('orders').updateOne(
            { orderId: orderId.toUpperCase() },
            { $set: updateFields }
        );

        return NextResponse.json({
            success: true,
            message: action === 'verify'
                ? 'Payment verified successfully'
                : 'Payment marked as failed',
            orderId: orderId.toUpperCase(),
            paymentStatus: updateFields.paymentStatus
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500 }
        );
    }
}

// Get all pending payments for admin verification
export async function GET(request) {
    try {
        const client = await clientPromise;
        const db = client.db('elitemarts');

        // Get orders with pending payment status
        const pendingOrders = await db.collection('orders')
            .find({
                $or: [
                    { paymentStatus: 'pending' },
                    { paymentStatus: { $exists: false }, status: 'pending' }
                ]
            })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        return NextResponse.json({
            success: true,
            orders: pendingOrders,
            count: pendingOrders.length
        });

    } catch (error) {
        console.error('Failed to fetch pending orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pending orders' },
            { status: 500 }
        );
    }
}
