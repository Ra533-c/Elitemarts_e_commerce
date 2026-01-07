// Simple PDF invoice generation

export async function generateClientInvoice(orderData) {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ELITEMARTS', 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('INVOICE', 20, y);
    y += 20;

    // Order Number
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Order Number: ${orderData.orderId}`, 20, y);
    y += 15;

    // Customer Details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Details:', 20, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${orderData.name || 'Customer'}`, 20, y);
    y += 6;
    doc.text(`Phone: ${orderData.phone || ''}`, 20, y);
    y += 6;
    doc.text(`Address: ${orderData.address || ''}`, 20, y);
    y += 6;
    doc.text(`City: ${orderData.city || ''}, ${orderData.state || ''} ${orderData.pincode || ''}`, 20, y);
    y += 15;

    // Order Summary
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Summary:', 20, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.text('Robotic Neck & Shoulder Massager - Rs.1,199.00', 20, y);
    y += 10;

    // Payment Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information:', 20, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.text('Advance Payment (Rs.600): COMPLETED', 20, y);
    y += 6;
    doc.text('Balance Payment (Rs.599): PENDING', 20, y);
    y += 15;

    // Delivery Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Information:', 20, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.text('Delivery Address: As mentioned above', 20, y);
    y += 6;
    doc.text('Estimated Delivery: 5-6 business days', 20, y);
    y += 6;
    doc.text('Delivery Partner: EliteMarts Logistics', 20, y);
    y += 6;
    doc.text('Tracking: Available after payment verification', 20, y);
    y += 20;

    // Simple footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Thanks for shopping on EliteMarts', 20, y);

    // Save the PDF
    doc.save(`${orderData.orderId}.pdf`);
    return true;
}