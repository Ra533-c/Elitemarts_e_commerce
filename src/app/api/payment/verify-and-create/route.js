import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';

export async function POST(request) {
    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        // Get payment session
        const session = await db.collection('payment_sessions').findOne({ sessionId });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Check if payment is verified
        if (session.paymentStatus !== 'verified') {
            return NextResponse.json({
                error: 'Payment not verified yet',
                status: session.paymentStatus
            }, { status: 400 });
        }

        // Check if order already created
        if (session.orderId) {
            return NextResponse.json({
                success: true,
                orderId: session.orderId,
                message: 'Order already created'
            });
        }

        // Generate unique Order ID
        const orderId = `ELITE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Create order document
        const orderDoc = {
            orderId,
            customerName: session.customerData.name,
            phone: session.customerData.phone,
            address: session.customerData.address,
            pricing: session.pricing,
            qrCode: session.qrCode,
            paymentStatus: 'verified',
            status: 'paid',
            paymentSessionId: sessionId,
            createdAt: new Date(),
            updatedAt: new Date(),
            paymentVerifiedAt: new Date()
        };

        // Insert order
        await db.collection('orders').insertOne(orderDoc);

        // Update session with orderId
        await db.collection('payment_sessions').updateOne(
            { sessionId },
            { $set: { orderId, updatedAt: new Date() } }
        );

        return NextResponse.json({
            success: true,
            orderId,
            message: 'Order created successfully!',
            order: {
                orderId,
                customerName: orderDoc.customerName,
                phone: orderDoc.phone,
                pricing: orderDoc.pricing
            }
        });

    } catch (error) {
        console.error('Order creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create order', details: error.message },
            { status: 500 }
        );
    }
}
