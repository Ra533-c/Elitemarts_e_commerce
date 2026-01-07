// Client-side PDF generation utility
// This runs in the browser, not on the server

export async function generateClientInvoice(orderData) {
    // Dynamically import jsPDF only on client side
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF();

    // Colors
    const primaryColor = [46, 125, 50]; // Green
    const secondaryColor = [33, 33, 33]; // Dark gray
    const accentColor = [255, 87, 34]; // Orange

    // Header - Elitemarts Branding
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ELITEMARTS', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Robotic Massagers & Health Products', 105, 30, { align: 'center' });

    // Invoice Title
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 55, { align: 'center' });

    // Invoice Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${orderData.orderId}`, 20, 70);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 80);
    doc.text(`Time: ${new Date().toLocaleTimeString('en-IN')}`, 20, 90);

    // Customer Details Section
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 100, 170, 25, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('CUSTOMER DETAILS', 25, 110);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    doc.text(`Name: ${orderData.name || 'Customer'}`, 25, 118);
    doc.text(`Phone: ${orderData.phone || ''}`, 25, 125);

    // Product Details Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('PRODUCT DETAILS', 20, 140);

    // Table Header
    doc.setFillColor(...primaryColor);
    doc.rect(20, 145, 170, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Product', 25, 150);
    doc.text('Qty', 120, 150);
    doc.text('Price', 150, 150);

    // Table Content
    doc.setFillColor(250, 250, 250);
    doc.rect(20, 153, 170, 12, 'F');
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Robotic Neck & Shoulder Massager', 25, 160);
    doc.text('1', 125, 160);
    doc.text('₹1,199', 150, 160);

    // Pricing Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('PAYMENT DETAILS', 20, 175);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);

    // Prepaid Status
    doc.setFillColor(76, 175, 80);
    doc.rect(20, 180, 170, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('✓ Prepaid Amount (₹600) - PAID', 25, 185);

    // Pending Status
    doc.setFillColor(...accentColor);
    doc.rect(20, 188, 170, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('⏳ Balance Amount (₹599) - Pending on Delivery', 25, 193);

    // Delivery Address
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('DELIVERY ADDRESS', 20, 210);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    const address = `${orderData.address || ''}, ${orderData.city || ''}, ${orderData.state || ''} - ${orderData.pincode || ''}`;
    doc.text(address, 20, 218);

    // Delivery Information
    doc.setFillColor(255, 248, 225);
    doc.rect(20, 225, 170, 20, 'F');
    doc.setTextColor(...accentColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('🚚 DELIVERY INFORMATION', 25, 232);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    doc.text('• Delivery Time: 5-6 business days to your address', 25, 238);
    doc.text('• Our Shop: EliteMarts - Premium Health Products', 25, 244);

    // Contact Information
    doc.setFillColor(230, 255, 230);
    doc.rect(20, 250, 170, 15, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('📞 CONTACT US', 25, 257);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    doc.text('For any queries, contact us on Instagram: @elitemarts_official', 25, 263);

    // Terms & Conditions
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Terms: Product will be delivered after full payment verification. Warranty: 6 months on manufacturing defects.', 20, 275);
    doc.text('Thank you for choosing EliteMarts! Stay healthy, stay happy.', 20, 280);

    // Footer
    doc.setFillColor(...primaryColor);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('EliteMarts - Your Health, Our Priority | www.elitemarts.com', 105, 292, { align: 'center' });

    // Save the PDF directly to user's device
    doc.save(`${orderData.orderId}.pdf`);

    return true;
}