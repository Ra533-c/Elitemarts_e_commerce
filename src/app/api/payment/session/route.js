import { NextResponse } from 'next/server';
import crypto from 'crypto';
import clientPromise from '@/lib/database';
import QRCode from 'qrcode';
import { sendTelegramNotification } from '@/lib/notifications';


export async function POST(request) {
    const startTime = Date.now();

    try {
        const { customer, pricing } = await request.json();

        // Validation
        if (!customer?.name || !customer?.phone || !customer?.address) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate cryptographically strong unique session ID
        // Using crypto.randomUUID() ensures true uniqueness - no collisions even hours/days later
        const sessionId = `SESSION-${crypto.randomUUID()}`;

        // Generate UPI payment URL
        const upiId = process.env.UPI_ID || 'riya4862@airtel';
        const amount = 600;
        const upiUrl = `upi://pay?pa=${upiId}&pn=EliteMarts&am=${amount}&tn=Payment_${sessionId}&cu=INR`;

        // Parallel operations: Generate QR, Instamojo URL simultaneously
        const [qrCodeImage] = await Promise.all([
            // QR Code generation
            QRCode.toDataURL(upiUrl, {
                width: 300,
                margin: 2,
                color: { dark: '#000000', light: '#FFFFFF' }
            })
        ]);

        // Construct Instamojo URL (no async needed)
        const instamojoBaseUrl = process.env.INSTAMOJO_LINK || 'https://imjo.in/Hvu4ws';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const returnUrl = `${appUrl}/success`;
        const instamojoUrl = `${instamojoBaseUrl}?amount=600&purpose=BOOKING_FEE&order_id=${sessionId}&buyer_name=${encodeURIComponent(customer.name)}&phone=${customer.phone}&redirect_url=${encodeURIComponent(returnUrl)}`;

        // Prepare session document
        const sessionDoc = {
            sessionId,
            customerData: {
                name: customer.name,
                phone: customer.phone,
                address: {
                    street: customer.address,
                    city: customer.city || '',
                    state: customer.state || '',
                    pincode: customer.pincode || ''
                }
            },
            pricing: {
                originalPrice: 2999,
                finalPrice: pricing?.finalPrice || 1199,
                prepaidAmount: 600,
                balanceDue: (pricing?.finalPrice || 1199) - 600,
                couponApplied: pricing?.couponApplied || true
            },
            qrCode: {
                imageUrl: qrCodeImage,
                upiId,
                amount,
                data: upiUrl,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            },
            instamojoUrl,
            paymentStatus: 'pending',
            orderId: null,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        };

        // Save to DB and send Telegram notification in parallel
        const client = await clientPromise;
        const db = client.db('elitemarts');

        // Parallel DB save and Telegram notification
        await Promise.all([
            db.collection('payment_sessions').insertOne(sessionDoc),
            sendTelegramNotification({
                sessionId,
                customer,
                amount,
                qrCode: sessionDoc.qrCode,
                orderId: sessionId
            }).catch(err => console.error('Telegram notification failed:', err))
        ]);

        const endTime = Date.now();
        console.log(`Payment session created in ${endTime - startTime}ms`);

        return NextResponse.json({
            success: true,
            sessionId,
            qrCode: sessionDoc.qrCode,
            instamojoUrl,
            customerData: sessionDoc.customerData,
            expiresAt: sessionDoc.expiresAt,
            message: 'Payment session created successfully'
        });

    } catch (error) {
        console.error('Session creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create session', details: error.message },
            { status: 500 }
        );
    }
}

// GET endpoint to check session status
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    try {
        const client = await clientPromise;
        const db = client.db('elitemarts');

        const session = await db.collection('payment_sessions').findOne(
            { sessionId },
            {
                projection: {
                    paymentStatus: 1,
                    orderId: 1,
                    expiresAt: 1,
                    qrCode: 1,
                    rejectedAt: 1,
                    rejectionReason: 1,
                    customerData: 1
                }
            }
        );

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Check expiration
        if (new Date() > new Date(session.expiresAt) && session.paymentStatus === 'pending') {
            await db.collection('payment_sessions').updateOne(
                { sessionId },
                { $set: { paymentStatus: 'expired' } }
            );
            session.paymentStatus = 'expired';
        }

        return NextResponse.json({
            success: true,
            session: {
                sessionId: session.sessionId,
                paymentStatus: session.paymentStatus,
                orderId: session.orderId,
                expiresAt: session.expiresAt,
                qrCode: session.qrCode,
                rejectedAt: session.rejectedAt,
                rejectionReason: session.rejectionReason,
                customerData: session.customerData
            }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
    }
}

// PUT endpoint to update payment status
export async function PUT(request) {
    try {
        const { sessionId, paymentStatus } = await request.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        const result = await db.collection('payment_sessions').updateOne(
            { sessionId },
            { $set: { paymentStatus, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Payment status updated',
            paymentStatus
        });

    } catch (error) {
        console.error('Payment status update error:', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
