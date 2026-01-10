import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';
import QRCode from 'qrcode';

export async function POST(request) {
    try {
        const { customer, pricing } = await request.json();

        // Validation
        if (!customer?.name || !customer?.phone || !customer?.address) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate unique Session ID
        const sessionId = `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Generate UPI payment URL
        const upiId = process.env.UPI_ID || 'riya4862@airtel';
        const amount = 600;
        const upiUrl = `upi://pay?pa=${upiId}&pn=EliteMarts&am=${amount}&tn=Payment_${sessionId}&cu=INR`;

        // Generate QR Code as base64
        const qrCodeImage = await QRCode.toDataURL(upiUrl, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
        });

        // Generate Instamojo payment URL
        const instamojoBaseUrl = process.env.INSTAMOJO_LINK || 'https://imjo.in/Hvu4ws';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const returnUrl = `${appUrl}/success`;

        const instamojoUrl = `${instamojoBaseUrl}?amount=600&purpose=BOOKING_FEE&order_id=${sessionId}&buyer_name=${encodeURIComponent(customer.name)}&phone=${customer.phone}&redirect_url=${encodeURIComponent(returnUrl)}`;

        // Create payment session document
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
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
            },
            instamojoUrl, // Add Instamojo URL
            paymentStatus: 'pending', // pending, verified, failed, expired
            orderId: null, // Will be set after order creation
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        };

        // Save to MongoDB
        const client = await clientPromise;
        const db = client.db('elitemarts');
        await db.collection('payment_sessions').insertOne(sessionDoc);

        // Return session data
        return NextResponse.json({
            success: true,
            sessionId,
            qrCode: sessionDoc.qrCode,
            instamojoUrl, // Return Instamojo URL
            customerData: sessionDoc.customerData,
            expiresAt: sessionDoc.expiresAt,
            message: 'Payment session created successfully'
        });

    } catch (error) {
        console.error('Payment session creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create payment session', details: error.message },
            { status: 500 }
        );
    }
}

// GET endpoint to check session status
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        const session = await db.collection('payment_sessions').findOne({ sessionId });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Check if expired
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
                qrCode: session.qrCode
            }
        });

    } catch (error) {
        console.error('Session status check error:', error);
        return NextResponse.json({ error: 'Failed to check session status' }, { status: 500 });
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
