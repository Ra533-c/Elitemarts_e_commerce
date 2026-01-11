const clientPromise = require('../src/lib/database');

async function setupIndexes() {
    const client = await clientPromise;
    const db = client.db('elitemarts');

    console.log('Setting up indexes...');

    try {
        // Payment Sessions
        await db.collection('payment_sessions').createIndex({ sessionId: 1 }, { unique: true });
        await db.collection('payment_sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        await db.collection('payment_sessions').createIndex({ paymentStatus: 1 });
        await db.collection('payment_sessions').createIndex({ createdAt: -1 });
        await db.collection('payment_sessions').createIndex({ 'customerData.phone': 1 });

        console.log('✅ Payment sessions indexes created');

        // Orders
        await db.collection('orders').createIndex({ orderId: 1 }, { unique: true });
        await db.collection('orders').createIndex({ phone: 1 });
        await db.collection('orders').createIndex({ paymentSessionId: 1 });
        await db.collection('orders').createIndex({ createdAt: -1 });
        await db.collection('orders').createIndex({ deliveryStatus: 1 });

        console.log('✅ Orders indexes created');

        console.log('✅ All indexes created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating indexes:', error);
        process.exit(1);
    }
}

setupIndexes().catch(console.error);
