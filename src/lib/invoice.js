// On Vercel (Serverless), we CANNOT write to the filesystem (public folder is read-only).
// So we will skip generating the PDF file during order creation to prevent crashes.
// 
// Invoice generation is disabled to prevent EROFS errors on Vercel deployment.
// Last updated: 2026-01-06

export async function generateInvoice(order) {
    // In a real app, you would generate this on-the-fly when the user clicks "Download Invoice"
    // using a separate API route, or upload it to S3/cloud storage.

    // Returning null to ensure the order proceeds without filesystem errors.
    console.log('Invoice generation skipped for order:', order.orderId);
    return null;
}
