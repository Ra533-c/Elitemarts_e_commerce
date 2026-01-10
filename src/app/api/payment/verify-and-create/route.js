import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';
import { bot, env } from '@/lib/telegram';

export async function POST(request) {
    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        // Get session
        const session = await db.collection('payment_sessions').findOne({ sessionId });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // ==== CRITICAL: Only allow if payment is VERIFIED ====
        if (session.paymentStatus !== 'verified') {
            return NextResponse.json({
                error: 'Payment not verified. Order cannot be created.',
                currentStatus: session.paymentStatus,
                message: 'Please wait for admin to verify your payment or complete payment via Instamojo for instant verification.'
            }, { status: 400 });
        }

        // Check if order already exists (prevent duplicates)
        if (session.orderId) {
            // Return existing order
            const existingOrder = await db.collection('orders').findOne({ orderId: session.orderId });
            return NextResponse.json({
                success: true,
                orderId: session.orderId,
                message: 'Order already exists',
                order: existingOrder
            });
        }

        // Generate Order ID
        const orderId = `ELITE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Calculate estimated delivery (4-6 business days from now)
        const estimatedDeliveryStart = new Date();
        estimatedDeliveryStart.setDate(estimatedDeliveryStart.getDate() + 4);
        const estimatedDeliveryEnd = new Date();
        estimatedDeliveryEnd.setDate(estimatedDeliveryEnd.getDate() + 6);

        // Create order document with delivery tracking
        const orderDoc = {
            orderId,
            customerName: session.customerData.name,
            phone: session.customerData.phone,
            email: session.customerData.email || null,
            address: session.customerData.address,
            pricing: session.pricing,
            paymentStatus: 'paid',
            deliveryStatus: 'processing', // processing, shipped, out_for_delivery, delivered
            status: 'confirmed',
            paymentSessionId: sessionId,
            paymentId: session.paymentId || 'manual_upi',
            paymentMethod: session.verifiedBy === 'instamojo' ? 'instamojo' : 'upi',
            createdAt: new Date(),
            paymentVerifiedAt: session.verifiedAt || new Date(),
            verifiedBy: session.verifiedBy || 'admin',
            estimatedDelivery: {
                start: estimatedDeliveryStart,
                end: estimatedDeliveryEnd,
                days: '4-6 business days'
            },
            trackingHistory: [
                {
                    status: 'confirmed',
                    message: 'Order confirmed and payment received',
                    timestamp: new Date()
                }
            ]
        };

        // Insert order
        await db.collection('orders').insertOne(orderDoc);

        // Update session with orderId
        await db.collection('payment_sessions').updateOne(
            { sessionId },
            { $set: { orderId, updatedAt: new Date() } }
        );

        // Send notification to admin with Order ID
        if (bot && env) {
            try {
                const adminMessage =
                    `🎉 *ORDER CREATED SUCCESSFULLY!*\n\n` +
                    `📦 *Order ID:* \`${orderId}\`\n` +
                    `🔖 *Session ID:* \`${sessionId}\`\n\n` +
                    `👤 *Customer:* ${session.customerData.name}\n` +
                    `📱 *Phone:* ${session.customerData.phone}\n` +
                    `💰 *Amount Paid:* ₹600\n\n` +
                    `📅 *Estimated Delivery:* 4-6 business days\n` +
                    `📍 *Status:* Processing`;

                await bot.sendMessage(env.TELEGRAM_ADMIN_CHAT_ID, adminMessage, {
                    parse_mode: 'Markdown'
                });
            } catch (notifError) {
                console.error('Failed to send order notification:', notifError);
            }
        }

        return NextResponse.json({
            success: true,
            orderId,
            message: 'Order created successfully!',
            order: {
                orderId,
                customerName: orderDoc.customerName,
                phone: orderDoc.phone,
                pricing: orderDoc.pricing,
                estimatedDelivery: orderDoc.estimatedDelivery,
                deliveryStatus: orderDoc.deliveryStatus
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
