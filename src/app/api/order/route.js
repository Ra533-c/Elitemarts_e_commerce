import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';
import QRCode from 'qrcode';

export async function POST(request) {
    try {
        const data = await request.json();
        const { customer, pricing } = data;

        // Validation
        if (!customer?.name || !customer?.phone || !customer?.address) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate unique Order ID
        const orderId = `ELITE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Generate UPI payment URL
        const upiId = process.env.UPI_ID || 'riya4862@airtel';
        const upiUrl = `upi://pay?pa=${upiId}&pn=EliteMarts&am=600&tn=Order_${orderId}&cu=INR`;

        // Generate QR Code as base64
        const qrCodeImage = await QRCode.toDataURL(upiUrl, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
        });

        // Create order document
        const orderDoc = {
            orderId,
            customerName: customer.name,
            phone: customer.phone,
            address: {
                street: customer.address,
                city: customer.city || '',
                state: customer.state || '',
                pincode: customer.pincode || ''
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
                amount: 600,
                data: upiUrl,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
            },
            paymentStatus: 'pending',
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Save to MongoDB
        const client = await clientPromise;
        const db = client.db('elitemarts');
        await db.collection('orders').insertOne(orderDoc);

        // Generate Instamojo URL
        const instamojoBaseUrl = process.env.INSTAMOJO_LINK || 'https://imjo.in/Hvu4ws';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const returnUrl = `${appUrl}/success?order_id=${orderId}`;

        const instamojoUrl = `${instamojoBaseUrl}?amount=600&purpose=BOOKING_FEE&order_id=${orderId}&buyer_name=${encodeURIComponent(customer.name)}&phone=${customer.phone}&redirect_url=${encodeURIComponent(returnUrl)}`;

        // Return response
        return NextResponse.json({
            success: true,
            orderId,
            message: 'Order created successfully',
            qrCode: orderDoc.qrCode,
            instamojoUrl
        });

    } catch (error) {
        console.error('Order creation error:', error);
        return NextResponse.json(
            { error: 'Order creation failed', details: error.message },
            { status: 500 }
        );
    }
}
