import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const password = searchParams.get('password');

        if (password !== 'admin123') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        const orders = await db.collection('orders')
            .find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ orders });

    } catch (error) {
        return NextResponse.json(
            { error: 'Fetch failed' },
            { status: 500 }
        );
    }
}
