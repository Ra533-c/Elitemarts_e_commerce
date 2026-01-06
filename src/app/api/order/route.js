import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';
import { generateInvoice } from '@/lib/invoice';
import { sendSMS } from '@/lib/notifications';

export async function POST(request) {
    try {
        const data = await request.json();
        const { customer, pricing, couponApplied } = data;

        // Auto-generate order ID if not provided (though frontend generated a mock one, better to regenerate or validate)
        // We'll use the one from frontend if available + suffix, or just generate new one to be safe.
        // Spec says: Generate unique order ID in backend.

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
            status: "pending", // "pending" manual verification
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Save to DB
        const client = await clientPromise;
        const db = client.db('elitemarts');
        await db.collection('orders').insertOne(orderDoc);

        // Generate Invoice
        const invoiceUrl = await generateInvoice(orderDoc);

        // Update doc with invoice URL (optional)
        await db.collection('orders').updateOne(
            { orderId },
            { $set: { invoiceUrl } }
        );

        // Send SMS
        await sendSMS({
            to: customer.phone,
            message: `Your order ${orderId} is placed! Please wait for payment verification.`
        });

        return NextResponse.json({
            success: true,
            orderId,
            invoiceUrl,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('Order Error:', error);
        return NextResponse.json(
            { error: 'Order creation failed' },
            { status: 500 }
        );
    }
}
