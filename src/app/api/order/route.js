import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';
import { sendSMS } from '@/lib/notifications';

export async function POST(request) {
    try {
        console.log('API Request Started - Version: NO_PDF_WRITE_FIX_v1');
        const data = await request.json();
        const { customer, pricing, couponApplied } = data;

        // Validate required fields
        if (!customer || !customer.name || !customer.phone || !customer.address) {
            return NextResponse.json(
                { error: 'Missing required customer information' },
                { status: 400 }
            );
        }

        // Create random ID
        const orderId = `ELITE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const orderDoc = {
            orderId,
            customerName: customer.name,
            phone: customer.phone,
            address: {
                street: customer.address,
                city: customer.city,
                state: customer.state,
                pincode: customer.pincode
            },
            pricing: {
                originalPrice: 2999,
                couponApplied,
                couponCode: couponApplied ? "ELITEMARTS27" : null,
                finalPrice: pricing.finalPrice,
                prepaidAmount: 600,
                balanceDue: pricing.balanceDue
            },
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Save to DB with better error handling
        let client;
        try {
            client = await clientPromise;
            console.log('MongoDB connected successfully');
        } catch (dbError) {
            console.error('MongoDB connection failed:', dbError);
            return NextResponse.json(
                { error: 'Database connection failed. Please try again.' },
                { status: 503 }
            );
        }

        const db = client.db('elitemarts');

        try {
            await db.collection('orders').insertOne(orderDoc);
            console.log('Order saved:', orderId);
        } catch (insertError) {
            console.error('Order insert failed:', insertError);
            return NextResponse.json(
                { error: 'Failed to save order. Please try again.' },
                { status: 500 }
            );
        }

        // Send SMS (non-blocking)
        try {
            await sendSMS({
                to: customer.phone,
                message: `Your order ${orderId} is placed! Please wait for payment verification.`
            });
        } catch (smsError) {
            console.error('SMS failed:', smsError);
            // Don't fail the order if SMS fails
        }

        return NextResponse.json({
            success: true,
            orderId,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('Order Error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);

        return NextResponse.json(
            {
                error: 'Order creation failed. Please try again.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
