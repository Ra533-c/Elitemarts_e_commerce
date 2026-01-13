import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';

export async function POST(request) {
    try {
        const { orderId, password } = await request.json();

        // Simple Admin Auth
        if (password !== 'admin123') { // Replace with env var in real app
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        const updateResult = await db.collection('orders').updateOne(
            { orderId },
            {
                $set: {
                    status: 'paid',
                    paymentVerifiedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );

        if (updateResult.modifiedCount === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Fetch order to get phone number (for future SMS integration)
        const order = await db.collection('orders').findOne({ orderId });

        if (order) {
            console.log(`Payment verified for order ${orderId}, customer: ${order.phone}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Payment verified'
        });

    } catch (error) {
        console.error('Verify Error:', error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}
