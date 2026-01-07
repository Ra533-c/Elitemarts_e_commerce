// Client-side PDF generation utility
// This runs in the browser, not on the server

export async function generateClientInvoice(orderData) {
    // Dynamically import jsPDF only on client side
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF();

    // Set up the PDF
    doc.setFontSize(22);
    doc.text('ELITEMARTS INVOICE', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Order ID: ${orderData.orderId}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);

    doc.text('Bill To:', 20, 70);
    doc.text(orderData.name || 'Customer', 20, 80);
    doc.text(orderData.phone || '', 20, 90);
    doc.text(`${orderData.city || ''}, ${orderData.state || ''}`, 20, 100);
    doc.text(orderData.pincode || '', 20, 110);

    doc.text('Item Details:', 20, 130);
    doc.text('Robotic Neck & Shoulder Massager', 20, 140);
    doc.text(`Price: Rs. ${orderData.pricing?.finalPrice || 1199}`, 150, 140);

    doc.text(`Amount Paid (Booking): Rs. ${orderData.pricing?.prepaidAmount || 600}`, 20, 160);
    doc.text(`Balance Due: Rs. ${orderData.pricing?.balanceDue || 599}`, 20, 170);

    doc.text('Thank you for your business!', 105, 200, { align: 'center' });

    // Save the PDF directly to user's device
    doc.save(`${orderData.orderId}.pdf`);

    return true;
}