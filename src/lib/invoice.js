// On Vercel (Serverless), we CANNOT write to the filesystem (public folder is read-only).
// So we will skip generating the PDF file during order creation to prevent crashes.

export async function generateInvoice(order) {
    // In a real app, you would generate this on-the-fly when the user clicks "Download Invoice"
    // using a separate API route, or upload it to S3.

    // returning null ensuring the order proceeds without error.
    return null;
}
