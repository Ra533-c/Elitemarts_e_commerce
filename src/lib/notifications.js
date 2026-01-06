// This is a placeholder for actual SMS/WhatsApp integration
// You would need valid API keys for Twilio or TextLocal

export async function sendSMS({ to, message }) {
    console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
    // In production: call Twilio/TextLocal API here
    return true;
}

export async function sendWhatsApp({ to, template, parameters }) {
    console.log(`[MOCK WHATSAPP] To: ${to}, Template: ${template}, Params: ${JSON.stringify(parameters)}`);
    // In production: call Twilio WhatsApp API here
    return true;
}
