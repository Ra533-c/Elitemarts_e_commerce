import autoTable from 'jspdf-autotable';

// Professional color scheme
const COLORS = {
    primary: '#1e40af',    // EliteMarts Blue
    secondary: '#f97316',  // Orange accent
    dark: '#1f2937',       // Dark text
    light: '#6b7280',      // Light text
    border: '#e5e7eb',     // Border color
    background: '#f9fafb'  // Light background
};

// EliteMarts Branding
const COMPANY_INFO = {
    name: 'ELITEMARTS',
    tagline: 'Premium Lifestyle & Wellness Store',
    email: 'support@elitemarts.com',
    phone: '+91-8607832386',
    instagram: '@elitemartsofficial',
    website: 'www.elitemarts.com',
    address: 'India'
};

// Main invoice generator function
export async function generateClientInvoice(orderData) {
    try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        // Generate invoice with all sections
        addHeader(doc);
        addInvoiceDetails(doc, orderData);
        addCustomerDetails(doc, orderData);
        addProductTable(doc, orderData);
        addPaymentSummary(doc, orderData);
        addDeliveryDetails(doc, orderData);
        addFooter(doc);

        // Save the PDF
        doc.save(`EliteMarts_Invoice_${orderData.orderId}.pdf`);
        return true;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw new Error(`Failed to generate invoice: ${error.message}`);
    }
}

// Header with company branding
function addHeader(doc) {
    const pageWidth = doc.internal.pageSize.width;

    // Company Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(COLORS.primary);
    doc.text(COMPANY_INFO.name, 15, 25);

    // Tagline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.light);
    doc.text(COMPANY_INFO.tagline, 15, 32);

    // Contact line
    doc.setFontSize(8);
    const contactText = `📧 ${COMPANY_INFO.email} | 📞 ${COMPANY_INFO.phone} | 📷 DM: ${COMPANY_INFO.instagram}`;
    doc.text(contactText, 15, 38);

    // Horizontal line
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(15, 45, pageWidth - 15, 45);
}

// Invoice details section
function addInvoiceDetails(doc, data) {
    const startY = 55;

    // Invoice title on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLORS.primary);
    doc.text('OFFICIAL INVOICE', 140, startY);

    // Invoice metadata box
    const details = [
        ['Invoice No:', data.orderId || 'N/A', 'Date:', new Date().toLocaleDateString('en-IN')],
        ['Order ID:', data.orderId || 'N/A', 'Time:', new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })]
    ];

    autoTable(doc, {
        startY: startY + 5,
        head: [],
        body: details,
        theme: 'plain',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            textColor: COLORS.dark
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 25 },
            1: { cellWidth: 60 },
            2: { fontStyle: 'bold', cellWidth: 20 },
            3: { cellWidth: 30 }
        },
        margin: { left: 120 },
        tableLineColor: COLORS.border,
        tableLineWidth: 0.1
    });
}

// Customer details section
function addCustomerDetails(doc, data) {
    const startY = 85;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.text('BILL TO / SHIP TO', 15, startY);

    // Format address
    const address = data.address;
    let addressText = '';
    if (typeof address === 'object') {
        addressText = `${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;
    } else {
        addressText = address || 'Not provided';
    }

    const customerInfo = [
        [`Name: ${data.name || data.customerName || 'Customer'}`],
        [`Phone: ${data.phone || 'N/A'}`],
        [`Email: ${data.email || 'N/A'}`],
        ['Address:'],
        [addressText]
    ];

    autoTable(doc, {
        startY: startY + 5,
        head: [],
        body: customerInfo,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            textColor: COLORS.dark,
            lineColor: COLORS.border,
            lineWidth: 0.1
        },
        columnStyles: {
            0: { cellWidth: 90 }
        },
        margin: { left: 15 },
        tableWidth: 90
    });
}

// Product table
function addProductTable(doc, data) {
    const startY = 145;

    // Table header
    const headers = [['#', 'Product Description', 'Quantity', 'Unit Price', 'Total']];

    // Table body
    const products = [
        [
            1,
            'Robotic Neck & Shoulder Massager with Heat Therapy',
            '1',
            '₹1,199.00',
            '₹1,199.00'
        ]
    ];

    autoTable(doc, {
        startY: startY,
        head: headers,
        body: products,
        theme: 'grid',
        headStyles: {
            fillColor: COLORS.primary,
            textColor: '#ffffff',
            fontStyle: 'bold',
            fontSize: 9
        },
        styles: {
            font: 'helvetica',
            fontSize: 9,
            textColor: COLORS.dark
        },
        alternateRowStyles: {
            fillColor: COLORS.background
        },
        margin: { left: 15, right: 15 },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' }
        },
        tableLineColor: COLORS.border,
        tableLineWidth: 0.1
    });
}

// Payment summary
function addPaymentSummary(doc, data) {
    const startY = doc.lastAutoTable.finalY + 10;
    const pageWidth = doc.internal.pageSize.width;

    const pricing = data.pricing || {};
    const finalPrice = pricing.finalPrice || 1199;
    const discount = pricing.couponApplied ? 1800 : 0;
    const subtotal = finalPrice + discount;

    // Summary on right side
    let currentY = startY;

    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.dark);
    doc.text('Subtotal:', pageWidth - 65, currentY);
    doc.text(`₹${subtotal.toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });
    currentY += 6;

    // Discount
    if (pricing.couponApplied) {
        doc.text('Coupon Discount (ELITEMARTS27):', pageWidth - 65, currentY);
        doc.text(`-₹${discount.toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });
        currentY += 6;
    }

    // Shipping
    doc.text('Shipping:', pageWidth - 65, currentY);
    doc.text('₹0.00', pageWidth - 25, currentY, { align: 'right' });
    currentY += 6;

    // Tax
    doc.text('Tax (GST):', pageWidth - 65, currentY);
    doc.text('₹0.00', pageWidth - 25, currentY, { align: 'right' });
    currentY += 6;

    // Final Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.primary);
    doc.text('FINAL TOTAL:', pageWidth - 65, currentY);
    doc.text(`₹${finalPrice.toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });

    // Line for total
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(pageWidth - 65, currentY + 2, pageWidth - 15, currentY + 2);

    currentY += 10;

    // Payment status badges
    const advancePaid = data.paymentStatus === 'paid' || data.paymentStatus === 'verified';
    const balanceAmount = finalPrice - 600;

    // Advance payment badge
    drawBadge(doc, 15, currentY, 'Advance Payment: COMPLETED', '#10b981');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.dark);
    doc.text('₹600.00', 90, currentY);

    currentY += 8;

    // Balance payment badge
    const balanceStatus = data.deliveryStatus === 'delivered' ? 'COMPLETED' : 'PENDING (COD)';
    const balanceColor = data.deliveryStatus === 'delivered' ? '#10b981' : '#f59e0b';
    drawBadge(doc, 15, currentY, `Balance Payment: ${balanceStatus}`, balanceColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.dark);
    doc.text(`₹${balanceAmount.toFixed(2)}`, 110, currentY);
}

// Delivery details
function addDeliveryDetails(doc, data) {
    const startY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 50 : 200;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.text('DELIVERY INFORMATION', 15, startY);

    // Get delivery info
    const deliveryDays = data.estimatedDelivery?.days || '4-6 business days';
    let estimatedDate = deliveryDays;
    if (data.estimatedDelivery?.start && data.estimatedDelivery?.end) {
        const startDate = new Date(data.estimatedDelivery.start).toLocaleDateString('en-IN');
        const endDate = new Date(data.estimatedDelivery.end).toLocaleDateString('en-IN');
        estimatedDate = `${startDate} - ${endDate}`;
    }

    const deliveryInfo = [
        ['Delivery Address:', 'As mentioned above'],
        ['Delivery Partner:', 'EliteMarts Logistics'],
        ['Estimated Delivery:', estimatedDate],
        ['Tracking ID:', data.orderId ? `EM-TRK-${data.orderId.split('-')[1]}` : 'Will be provided after dispatch']
    ];

    autoTable(doc, {
        startY: startY + 5,
        head: [],
        body: deliveryInfo,
        theme: 'plain',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            textColor: COLORS.dark
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 40 },
            1: { cellWidth: 'auto' }
        },
        margin: { left: 15 },
        tableLineColor: COLORS.border,
        tableLineWidth: 0.1
    });
}

// Footer with contact info
function addFooter(doc) {
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 30;

    // Separator line
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(15, footerY - 10, 195, footerY - 10);

    // Thank you note
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.text('Thank you for shopping with EliteMarts!', 105, footerY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.dark);
    doc.text('Your health and wellness is our priority', 105, footerY + 6, { align: 'center' });

    // Contact info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.light);

    const contactLine1 = `Email: ${COMPANY_INFO.email} | Phone: ${COMPANY_INFO.phone}`;
    const contactLine2 = `Instagram DM: ${COMPANY_INFO.instagram} | Website: ${COMPANY_INFO.website}`;

    doc.text(contactLine1, 105, footerY + 14, { align: 'center' });
    doc.text(contactLine2, 105, footerY + 19, { align: 'center' });
}

// Helper function to draw status badges
function drawBadge(doc, x, y, text, color) {
    const textWidth = doc.getTextWidth(text);
    const padding = 3;

    // Badge background
    doc.setFillColor(color);
    doc.roundedRect(x, y - 4, textWidth + padding * 2, 8, 2, 2, 'F');

    // Badge text
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(text, x + padding, y);
}