import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';
import { sendSMS } from '@/lib/notifications';

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

        // Fetch order to get phone number
        const order = await db.collection('orders').findOne({ orderId });

        if (order) {
            await sendSMS({
                to: order.phone,
                message: `Payment confirmed for Order ${orderId}! We will ship shortly.`
            });
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
