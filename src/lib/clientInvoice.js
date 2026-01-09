// Professional PDF invoice generation

export async function generateClientInvoice(orderData) {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    let y = 20;

    // Header with logo-like design
    doc.setFillColor(0, 123, 255); // Blue background
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('ELITEMARTS', 20, y + 5);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Health & Wellness Products', 20, y + 15);

    doc.setFontSize(12);
    doc.text('OFFICIAL INVOICE', 160, y + 15, { align: 'right' });

    y += 50;

    // Invoice Details Box
    doc.setFillColor(248, 249, 250); // Light gray
    doc.rect(140, y - 5, 50, 35, 'F');
    doc.setDrawColor(222, 226, 230);
    doc.rect(140, y - 5, 50, 35);

    doc.setTextColor(33, 37, 41); // Dark gray
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE DETAILS', 145, y + 2);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${orderData.orderId}`, 145, y + 10);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 145, y + 17);
    doc.text(`Time: ${new Date().toLocaleTimeString('en-IN')}`, 145, y + 24);

    // Customer Details Box
    doc.setFillColor(255, 255, 255);
    doc.rect(20, y - 5, 110, 35, 'F');
    doc.setDrawColor(222, 226, 230);
    doc.rect(20, y - 5, 110, 35);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO / SHIP TO', 25, y + 2);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${orderData.name || 'Customer'}`, 25, y + 10);
    doc.text(`Phone: ${orderData.phone || ''}`, 25, y + 17);
    doc.text(`Address: ${orderData.address || ''}`, 25, y + 24);

    y += 45;

    // Order Summary Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text('ORDER SUMMARY', 20, y);
    y += 10;

    // Product Details
    doc.setFillColor(248, 249, 250);
    doc.rect(20, y, 170, 20, 'F');
    doc.setDrawColor(222, 226, 230);
    doc.rect(20, y, 170, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Product:', 25, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.text('Robotic Neck & Shoulder Massager', 50, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.text('Quantity:', 25, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.text('1 Unit', 50, y + 15);

    y += 25;

    // Pricing Table
    doc.setFillColor(0, 123, 255);
    doc.rect(20, y, 170, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPTION', 25, y + 8);
    doc.text('AMOUNT', 165, y + 8);

    y += 12;

    // Subtotal Row
    doc.setFillColor(255, 255, 255);
    doc.rect(20, y, 170, 10, 'F');
    doc.setDrawColor(222, 226, 230);
    doc.rect(20, y, 170, 10);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal (1 Unit)', 25, y + 7);
    doc.text('Rs. 1,199.00', 165, y + 7, { align: 'right' });

    y += 10;

    // Discount Row (if applicable)
    if (orderData.pricing?.couponApplied) {
        doc.setFillColor(240, 255, 240);
        doc.rect(20, y, 170, 10, 'F');
        doc.setDrawColor(222, 226, 230);
        doc.rect(20, y, 170, 10);
        doc.setTextColor(0, 128, 0);
        doc.text('Coupon Discount (ELITEMARTS27)', 25, y + 7);
        doc.text('-Rs. 400.00', 165, y + 7, { align: 'right' });
        y += 10;
    }

    // Total Row
    doc.setFillColor(0, 123, 255);
    doc.rect(20, y, 170, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('FINAL TOTAL', 25, y + 8);
    doc.text(`Rs. ${orderData.pricing?.finalPrice || 1199}.00`, 165, y + 8, { align: 'right' });

    y += 25;

    // Payment Information
    doc.setTextColor(33, 37, 41);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT INFORMATION', 20, y);
    y += 10;

    // Payment Status Boxes
    const boxHeight = 15;
    const boxWidth = 170;

    // Advance Payment
    doc.setFillColor(40, 167, 69);
    doc.rect(20, y, boxWidth, boxHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ ADVANCE PAYMENT COMPLETED', 25, y + 10);
    doc.text('Rs. 600', 180, y + 10, { align: 'right' });

    y += boxHeight + 2;

    // Balance Payment
    doc.setFillColor(255, 193, 7);
    doc.rect(20, y, boxWidth, boxHeight, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('⏳ BALANCE PAYMENT PENDING', 25, y + 10);
    doc.text('Rs. 599', 180, y + 10, { align: 'right' });

    y += boxHeight + 15;

    // Delivery Information
    doc.setTextColor(33, 37, 41);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY INFORMATION', 20, y);
    y += 10;

    doc.setFillColor(248, 249, 250);
    doc.rect(20, y, 170, 35, 'F');
    doc.setDrawColor(222, 226, 230);
    doc.rect(20, y, 170, 35);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(33, 37, 41);
    doc.text('• Delivery Address: As mentioned above', 25, y + 8);
    doc.text('• Estimated Delivery: 5-6 business days', 25, y + 15);
    doc.text('• Delivery Partner: EliteMarts Logistics', 25, y + 22);
    doc.text('• Tracking: Available after payment verification', 25, y + 29);

    y += 45;

    // Terms & Conditions
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('TERMS & CONDITIONS:', 20, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('• Product will be delivered after full payment verification.', 20, y);
    y += 5;
    doc.text('• 6 months warranty on manufacturing defects only.', 20, y);
    y += 5;
    doc.text('• Returns accepted within 7 days of delivery (unused products only).', 20, y);

    y += 20;

    // Footer
    doc.setFillColor(50, 50, 50);
    doc.rect(0, 270, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Need Help? Contact us:', 20, 277);
    doc.text('Email: support@elitemarts.com | Phone: +91-XXXXXXXXXX', 20, 283);

    // Thank you message
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for shopping with EliteMarts!', 105, 250, { align: 'center' });
    doc.text('Your health is our priority.', 105, 257, { align: 'center' });

    // Save the PDF
    doc.save(`${orderData.orderId}.pdf`);
    return true;
}