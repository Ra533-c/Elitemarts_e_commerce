import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        const order = await db.collection('orders').findOne({ orderId: orderId.toUpperCase() });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Auto-expire old QR codes
        if (order.qrCode?.expiresAt && new Date() > new Date(order.qrCode.expiresAt) && order.paymentStatus === 'pending') {
            await db.collection('orders').updateOne(
                { orderId: orderId.toUpperCase() },
                { $set: { paymentStatus: 'failed', updatedAt: new Date() } }
            );
            order.paymentStatus = 'failed';
        }

        return NextResponse.json({
            success: true,
            order: {
                orderId: order.orderId,
                customerName: order.customerName,
                phone: order.phone,
                address: order.address,
                pricing: order.pricing,
                paymentStatus: order.paymentStatus,
                status: order.status,
                createdAt: order.createdAt,
                verifiedAt: order.verifiedAt,
                paymentVerifiedAt: order.paymentVerifiedAt,
                qrCode: order.qrCode
            },
            status: order.paymentStatus,
            canDownloadInvoice: order.paymentStatus === 'verified' || order.status === 'paid'
        });

    } catch (error) {
        console.error('Order lookup error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const data = await request.json();
        const { orderId, status, paymentStatus, verifiedBy } = data;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        const updateFields = {
            updatedAt: new Date()
        };

        // Update order status if provided
        if (status) {
            updateFields.status = status;
            if (status === 'paid') {
                updateFields.paymentCompletedAt = new Date();
            }
        }

        // Update payment verification status if provided
        if (paymentStatus) {
            updateFields.paymentStatus = paymentStatus;

            if (paymentStatus === 'verified') {
                updateFields.paymentVerifiedAt = new Date();
                updateFields.status = 'paid';
                if (verifiedBy) {
                    updateFields.verifiedBy = verifiedBy;
                }
            } else if (paymentStatus === 'failed') {
                updateFields.paymentFailedAt = new Date();
                updateFields.status = 'pending';
            }
        }

        const result = await db.collection('orders').updateOne(
            { orderId: orderId.toUpperCase() },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Order status updated successfully',
            paymentStatus: paymentStatus || null
        });

    } catch (error) {
        console.error('Order status update error:', error);
        return NextResponse.json(
            { error: 'Failed to update order status' },
            { status: 500 }
        );
    }
}
