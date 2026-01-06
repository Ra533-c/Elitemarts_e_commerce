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

        return NextResponse.json({ order });

    } catch (error) {
        console.error('Order lookup error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}
