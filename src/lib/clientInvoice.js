import autoTable from 'jspdf-autotable';

// Company Information
const COMPANY_INFO = {
    name: 'ELITEMARTS',
    tagline: 'Premium Lifestyle & Wellness Store',
    instagram: 'elitemarts_'
};

// Simple, clean invoice generator
export async function generateClientInvoice(orderData) {
    try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        // Colors
        const BLUE = '#1e40af';
        const GREEN = '#10b981';
        const GRAY = '#6b7280';
        const DARK = '#1f2937';
        const LIGHT_GRAY = '#f3f4f6';

        // Get data safely
        const orderId = orderData.orderId || 'N/A';
        const name = orderData.customerName || orderData.name || 'Customer';
        const phone = orderData.phone || 'N/A';
        const email = orderData.email || 'N/A';

        // Address formatting
        let address = 'N/A';
        if (orderData.address) {
            if (typeof orderData.address === 'object') {
                const addr = orderData.address;
                address = `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`.replace(/, ,/g, ',').replace(/, -/g, ' -');
            } else {
                address = orderData.address;
            }
        }

        // Pricing
        const pricing = orderData.pricing || {};
        const finalPrice = pricing.finalPrice || 1199;
        const prepaidAmount = 100;
        const balanceDue = finalPrice - prepaidAmount;
        const discount = pricing.couponApplied ? 1800 : 0;

        const pageWidth = doc.internal.pageSize.width;

        // --- HEADER ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(DARK);
        doc.text('ELITEMARTS', 15, 20);

        doc.setFontSize(10);
        doc.setTextColor(GRAY);
        doc.text('Premium Lifestyle & Wellness Store', 15, 26);
        doc.text(`Instagram: @${COMPANY_INFO.instagram}`, 15, 32);

        // Line
        doc.setDrawColor(LIGHT_GRAY);
        doc.line(15, 38, 195, 38);

        // --- INVOICE DETAILS (Right side) ---
        doc.setFontSize(14);
        doc.setTextColor(BLUE);
        doc.text('INVOICE', 140, 55);

        const invoiceData = [
            ['Invoice No:', orderId],
            ['Date:', new Date().toLocaleDateString('en-IN')],
            ['Order ID:', orderId]
        ];

        autoTable(doc, {
            startY: 60,
            body: invoiceData,
            theme: 'plain',
            styles: { fontSize: 9, textColor: DARK },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 25 }, 1: { cellWidth: 50 } },
            margin: { left: 120 }
        });

        // --- CUSTOMER DETAILS ---
        doc.setFontSize(11);
        doc.setTextColor(BLUE);
        doc.text('CUSTOMER DETAILS', 15, 85);

        const customerData = [
            [`Name: ${name}`],
            [`Phone: ${phone}`],
            [`Email: ${email}`],
            ['Address:'],
            [address]
        ];

        autoTable(doc, {
            startY: 90,
            body: customerData,
            theme: 'grid',
            styles: { fontSize: 9, textColor: DARK },
            margin: { left: 15 },
            columnStyles: { 0: { cellWidth: 90 } },
            tableWidth: 90
        });

        // --- PRODUCT TABLE ---
        autoTable(doc, {
            startY: 125,
            head: [['#', 'Product Description', 'Qty', 'Price', 'Total']],
            body: [[
                '1',
                'Robotic Neck & Shoulder Massager with Heat Therapy',
                '1',
                `Rs ${finalPrice.toFixed(2)}`,
                `Rs ${finalPrice.toFixed(2)}`
            ]],
            theme: 'grid',
            headStyles: { fillColor: BLUE, textColor: '#fff', fontSize: 9 },
            styles: { fontSize: 9, textColor: DARK },
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 30, halign: 'right' },
                4: { cellWidth: 30, halign: 'right' }
            }
        });

        // --- PAYMENT SUMMARY (Right side) ---
        let yPos = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(10);
        doc.setTextColor(DARK);

        const summaryItems = [
            ['Subtotal:', `Rs ${(finalPrice + discount).toFixed(2)}`],
            ['Discount:', `-Rs ${discount.toFixed(2)}`],
            ['Shipping:', 'FREE'],
            ['Tax:', 'Included'],
            ['TOTAL:', `Rs ${finalPrice.toFixed(2)}`, 'bold']
        ];

        summaryItems.forEach(([label, value, style]) => {
            if (style === 'bold') {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(BLUE);
                yPos += 4;
            } else {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(DARK);
            }
            doc.text(label, pageWidth - 65, yPos);
            doc.text(value, pageWidth - 25, yPos, { align: 'right' });
            yPos += 6;
        });

        // Payment Status Badges
        yPos += 8;
        doc.setFillColor(GREEN);
        doc.roundedRect(15, yPos - 4, 60, 8, 2, 2, 'F');
        doc.setTextColor('#fff');
        doc.setFontSize(8);
        doc.text('Prepaid: Rs 100 PAID', 18, yPos);

        yPos += 12;
        const balanceColor = orderData.deliveryStatus === 'delivered' ? GREEN : '#f59e0b';
        doc.setFillColor(balanceColor);
        doc.roundedRect(15, yPos - 4, 70, 8, 2, 2, 'F');
        doc.text(`COD Balance: Rs ${balanceDue.toFixed(2)}`, 18, yPos);

        // --- DELIVERY INFO ---
        yPos += 20;
        doc.setFontSize(11);
        doc.setTextColor(BLUE);
        doc.text('DELIVERY INFORMATION', 15, yPos);

        const deliveryData = [
            ['Delivery Address:', address],
            ['Delivery Partner:', 'EliteMarts Logistics'],
            ['Estimated Delivery:', '4-6 business days'],
            ['Tracking ID:', `EM-TRK-${orderId.split('-')[1] || 'XXXX'}`]
        ];

        autoTable(doc, {
            startY: yPos + 5,
            body: deliveryData,
            theme: 'plain',
            styles: { fontSize: 9, textColor: DARK },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
            margin: { left: 15 }
        });

        // --- FOOTER ---
        const footerY = doc.internal.pageSize.height - 25;
        doc.setDrawColor(LIGHT_GRAY);
        doc.line(15, footerY - 10, 195, footerY - 10);

        doc.setFontSize(10);
        doc.setTextColor(BLUE);
        doc.text('Thank you for shopping with EliteMarts!', 105, footerY, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(GRAY);
        doc.text('Your health and wellness is our priority', 105, footerY + 6, { align: 'center' });
        doc.text(`Follow us: @${COMPANY_INFO.instagram}`, 105, footerY + 12, { align: 'center' });

        // Save
        doc.save(`EliteMarts_Invoice_${orderId}.pdf`);
        return true;
    } catch (error) {
        console.error('PDF Error:', error);
        throw new Error(`Failed: ${error.message}`);
    }
}