import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';

// GET endpoint to track order by Order ID or Phone Number
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const phone = searchParams.get('phone');

        if (!orderId && !phone) {
            return NextResponse.json({
                error: 'Order ID or Phone number required'
            }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        let order;

        if (orderId) {
            // Search by Order ID
            order = await db.collection('orders').findOne({ orderId });
        } else {
            // Search by phone number (get most recent order)
            order = await db.collection('orders')
                .findOne({ phone }, { sort: { createdAt: -1 } });
        }

        if (!order) {
            return NextResponse.json({
                error: 'Order not found',
                message: 'No order found with the provided details'
            }, { status: 404 });
        }

        // Calculate delivery progress percentage
        let progressPercentage = 0;
        switch (order.deliveryStatus) {
            case 'processing':
                progressPercentage = 25;
                break;
            case 'shipped':
                progressPercentage = 50;
                break;
            case 'out_for_delivery':
                progressPercentage = 75;
                break;
            case 'delivered':
                progressPercentage = 100;
                break;
            default:
                progressPercentage = 0;
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
                deliveryStatus: order.deliveryStatus,
                status: order.status,
                estimatedDelivery: order.estimatedDelivery,
                trackingHistory: order.trackingHistory || [],
                progressPercentage,
                createdAt: order.createdAt
            }
        });

    } catch (error) {
        console.error('Order tracking error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order details', details: error.message },
            { status: 500 }
        );
    }
}
