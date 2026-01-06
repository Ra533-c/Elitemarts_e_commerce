import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

export async function generateInvoice(order) {
    // This runs on server side
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text('ELITEMARTS INVOICE', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Order ID: ${order.orderId}`, 20, 40);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 50);

    doc.text('Bill To:', 20, 70);
    doc.text(order.customerName || 'Customer', 20, 80);
    doc.text(order.phone || '', 20, 90);
    doc.text(order.address?.city || '', 20, 100);

    doc.text('Item Details:', 20, 120);
    doc.text('Robotic Neck & Shoulder Massager', 20, 130);
    doc.text(`Price: Rs. ${order.pricing.finalPrice}`, 150, 130);

    doc.text(`Amount Paid (Booking): Rs. ${order.pricing.prepaidAmount}`, 20, 150);
    doc.text(`Balance Due: Rs. ${order.pricing.balanceDue}`, 20, 160);

    doc.text('Thank you for your business!', 105, 190, { align: 'center' });

    // Save/Output
    // Ensure public/invoices exists
    const invoiceDir = path.join(process.cwd(), 'public', 'invoices');
    if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
    }

    const fileName = `${order.orderId}.pdf`;
    const filePath = path.join(invoiceDir, fileName);

    // Note: jsPDF in Node might strictly require 'canvas' implementation or specific save method.
    // Standard jsPDF save() works in browser. In Node, output() arraybuffer -> fs.writeFileSync
    const pdfOutput = doc.output('arraybuffer');
    fs.writeFileSync(filePath, Buffer.from(pdfOutput));

    return `/invoices/${fileName}`;
}
