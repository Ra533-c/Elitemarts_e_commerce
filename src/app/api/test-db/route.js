import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('elitemarts');

        // Test connection
        await db.command({ ping: 1 });

        // Get database stats
        const stats = await db.stats();

        return NextResponse.json({
            success: true,
            message: 'MongoDB connected successfully!',
            database: 'elitemarts',
            collections: stats.collections || 0,
            dataSize: stats.dataSize || 0
        });
    } catch (error) {
        console.error('MongoDB Test Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
