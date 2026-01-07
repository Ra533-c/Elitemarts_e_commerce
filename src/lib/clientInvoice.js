// Client-side PDF generation utility
// Amazon-style professional invoice

export async function generateClientInvoice(orderData) {
    // Dynamically import jsPDF only on client side
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF();

    // Colors - Amazon style
    const primaryColor = [0, 123, 255]; // Blue
    const secondaryColor = [33, 37, 41]; // Dark gray
    const lightGray = [248, 249, 250]; // Light gray
    const borderColor = [222, 226, 230]; // Border gray

    // Header - Amazon style
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('EliteMarts', 20, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Health & Wellness Products', 20, 28);
    doc.text('Order Invoice', 170, 28, { align: 'right' });

    // Invoice Details Box
    doc.setFillColor(...lightGray);
    doc.rect(140, 45, 50, 25, 'F');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE DETAILS', 145, 52);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${orderData.orderId}`, 145, 58);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 145, 63);
    doc.text(`Time: ${new Date().toLocaleTimeString('en-IN')}`, 145, 68);

    // Bill To / Ship To
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO / SHIP TO', 20, 50);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${orderData.name || 'Customer'}`, 20, 58);
    doc.text(`${orderData.phone || ''}`, 20, 65);
    doc.text(`${orderData.address || ''}`, 20, 72);
    doc.text(`${orderData.city || ''}, ${orderData.state || ''} ${orderData.pincode || ''}`, 20, 79);

    // Order Summary Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Summary', 20, 95);

    // Table Header
    doc.setFillColor(...primaryColor);
    doc.rect(20, 100, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Item Description', 25, 106);
    doc.text('Qty', 130, 106);
    doc.text('Unit Price', 150, 106);
    doc.text('Total', 175, 106, { align: 'right' });

    // Table Row 1 - Product
    doc.setFillColor(255, 255, 255);
    doc.rect(20, 110, 170, 12, 'F');
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Robotic Neck & Shoulder Massager', 25, 117);
    doc.text('1', 135, 117, { align: 'center' });
    doc.text('₹1,199.00', 155, 117, { align: 'center' });
    doc.text('₹1,199.00', 185, 117, { align: 'right' });

    // Subtotal
    doc.setFillColor(...lightGray);
    doc.rect(20, 122, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 140, 127);
    doc.text('₹1,199.00', 185, 127, { align: 'right' });

    // Coupon Discount (if applied)
    if (orderData.pricing?.couponApplied) {
        doc.setFillColor(255, 255, 255);
        doc.rect(20, 130, 170, 8, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 128, 0); // Green
        doc.text('Coupon Discount (ELITEMARTS27):', 140, 135);
        doc.text('-₹400.00', 185, 135, { align: 'right' });
    }

    // Final Total
    doc.setFillColor(...primaryColor);
    doc.rect(20, 138, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL AMOUNT:', 140, 145);
    doc.text(`₹${orderData.pricing?.finalPrice || 1199}.00`, 185, 145, { align: 'right' });

    // Payment Information
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT INFORMATION', 20, 165);

    // Payment Status Table
    doc.setFillColor(...lightGray);
    doc.rect(20, 170, 170, 20, 'F');

    // Prepaid Row
    doc.setFillColor(40, 167, 69); // Green
    doc.rect(20, 170, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ ADVANCE PAYMENT (₹600)', 25, 177);
    doc.text('COMPLETED', 165, 177, { align: 'right' });

    // Balance Row
    doc.setFillColor(255, 193, 7); // Yellow
    doc.rect(20, 180, 170, 10, 'F');
    doc.setTextColor(0, 0, 0);
    doc.text('⏳ BALANCE PAYMENT (₹599)', 25, 187);
    doc.text('PENDING', 165, 187, { align: 'right' });

    // Delivery Information
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY INFORMATION', 20, 205);

    doc.setFillColor(...lightGray);
    doc.rect(20, 210, 170, 25, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    doc.text('• Delivery Address: As mentioned above', 25, 217);
    doc.text('• Estimated Delivery: 5-6 business days', 25, 223);
    doc.text('• Delivery Partner: EliteMarts Logistics', 25, 229);
    doc.text('• Tracking: Available after payment verification', 25, 235);

    // Terms & Conditions
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Terms & Conditions:', 20, 245);
    doc.text('• Product will be delivered after full payment verification.', 20, 250);
    doc.text('• 6 months warranty on manufacturing defects only.', 20, 255);
    doc.text('• Returns accepted within 7 days of delivery (unused products only).', 20, 260);

    // Contact Information
    doc.setFillColor(...primaryColor);
    doc.rect(0, 270, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Need Help? Contact us:', 20, 277);
    doc.text('📧 support@elitemarts.com | 📱 +91-XXXXXXXXXX | 📍 Instagram: @elitemarts_official', 20, 283);

    // Footer
    doc.setFillColor(50, 50, 50);
    doc.rect(0, 290, 210, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text('Thank you for shopping with EliteMarts! Your health is our priority.', 105, 295, { align: 'center' });

    // Save the PDF directly to user's device
    doc.save(`${orderData.orderId}.pdf`);

    return true;
}