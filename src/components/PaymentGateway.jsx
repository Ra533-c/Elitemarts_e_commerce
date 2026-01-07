'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Smartphone, Info, AlertCircle, Monitor, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { generateClientInvoice } from '@/lib/clientInvoice';

export default function PaymentGateway({ orderId, amount = 600, orderData, pricing }) {
    const [copied, setCopied] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const upiId = 'riya4862@airtel';
    const upiLink = `upi://pay?pa=${upiId}&pn=EliteMarts&am=${amount}&cu=INR&tn=Order ${orderId}`;

    useEffect(() => {
        // Detect if device is mobile
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
            return mobileKeywords.some(keyword => userAgent.includes(keyword)) || window.innerWidth < 768;
        };

        setIsMobile(checkMobile());
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(upiId);
        setCopied(true);
        toast.success('UPI ID copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUPIPayment = () => {
        if (isMobile) {
            // On mobile, try to open UPI app
            window.location.href = upiLink;
        } else {
            // On desktop, show instruction
            toast('Please scan the QR code above with your phone', {
                icon: '📱',
                duration: 4000,
            });
        }
    };

    const handleDownloadInvoice = async () => {
        try {
            if (!orderData) {
                toast.error('Order data not available');
                return;
            }

            const invoiceData = {
                ...orderData,
                pricing: pricing || { finalPrice: 1199, prepaidAmount: 600, balanceDue: 599 }
            };

            await generateClientInvoice(invoiceData);
            toast.success('Invoice downloaded successfully!');
        } catch (error) {
            console.error('Invoice download failed:', error);
            toast.error('Failed to download invoice');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
        >
            {/* Payment Amount Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Pay Booking Fee</h2>
                <p className="text-4xl sm:text-5xl font-black mb-2">₹{amount}</p>
                <p className="text-indigo-100 text-sm sm:text-base">Order ID: <span className="font-mono font-bold">{orderId}</span></p>
            </div>

            {/* Important Notice */}
            <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-left">
                <div className="flex gap-3 sm:gap-4">
                    <AlertCircle className="text-orange-600 shrink-0 mt-1" size={24} />
                    <div className="text-sm sm:text-base text-orange-900">
                        <p className="font-bold mb-2 text-base sm:text-lg">⚡ IMPORTANT - How Payment Works:</p>
                        <ul className="space-y-2 text-orange-800">
                            <li className="flex items-start gap-2">
                                <span className="font-bold shrink-0">1.</span>
                                <span>Scan QR code or pay via UPI app using ID: <span className="font-mono font-bold">{upiId}</span></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold shrink-0">2.</span>
                                <span>Payment goes directly to our bank account (100% working!)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold shrink-0">3.</span>
                                <span>Save your Order ID: <span className="font-mono font-bold">{orderId}</span></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold shrink-0">4.</span>
                                <span>We verify payment manually within 24 hours</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold shrink-0">5.</span>
                                <span>Check status anytime using "Check Order Status" section below</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-white p-4 sm:p-8 rounded-3xl border-2 border-indigo-100 shadow-xl mb-6 sm:mb-8">
                <p className="text-gray-600 mb-4 sm:mb-6 font-medium text-sm sm:text-base">
                    {isMobile ? 'Scan QR code or use button below' : 'Scan QR code with your phone'}
                </p>

                <div className="bg-white p-3 sm:p-4 inline-block rounded-2xl border-4 border-indigo-600 mb-4 sm:mb-6 shadow-lg">
                    <QRCodeSVG
                        value={upiLink}
                        size={typeof window !== 'undefined' && window.innerWidth < 640 ? 180 : 220}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                <div className="space-y-4 sm:space-y-5">
                    <div>
                        <p className="text-sm text-gray-600 mb-2 font-semibold">Or pay manually to UPI ID:</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <code className="bg-indigo-50 px-4 sm:px-6 py-3 rounded-xl border-2 border-indigo-200 font-mono text-base sm:text-lg font-bold text-indigo-700 break-all">
                                {upiId}
                            </code>
                            <button
                                onClick={copyToClipboard}
                                className="w-full sm:w-auto p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                                title="Copy UPI ID"
                            >
                                {copied ? <><Check size={20} /> Copied!</> : <><Copy size={20} /> Copy</>}
                            </button>
                        </div>
                    </div>

                    <div className="relative my-4 sm:my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t-2 border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs sm:text-sm uppercase">
                            <span className="bg-white px-4 text-gray-500 font-bold">Quick Pay</span>
                        </div>
                    </div>

                    <button
                        onClick={handleUPIPayment}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 sm:py-4 rounded-2xl flex items-center justify-center gap-3 hover:from-indigo-700 hover:to-purple-700 transition-all font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl"
                    >
                        {isMobile ? (
                            <>
                                <Smartphone size={24} />
                                Open UPI App
                            </>
                        ) : (
                            <>
                                <Monitor size={24} />
                                Scan QR with Phone
                            </>
                        )}
                    </button>

                    {!isMobile && (
                        <p className="text-xs text-gray-500 mt-2">
                            💡 UPI apps only work on mobile. Please scan the QR code with your phone.
                        </p>
                    )}
                </div>
            </div>

            {/* Download Invoice Button */}
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
                <button
                    onClick={handleDownloadInvoice}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 sm:py-4 rounded-2xl flex items-center justify-center gap-3 hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl"
                >
                    <Download size={24} />
                    Download Invoice (PDF)
                </button>
                <p className="text-xs text-green-700 mt-2 text-center">
                    📄 PDF will be saved directly to your device
                </p>
            </div>

            {/* After Payment Instructions */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-6 text-left">
                <div className="flex gap-3 sm:gap-4">
                    <Info className="text-blue-600 shrink-0 mt-1" size={24} />
                    <div className="text-sm sm:text-base text-blue-900">
                        <p className="font-bold mb-2 text-base sm:text-lg">✅ After Payment:</p>
                        <ul className="space-y-2 text-blue-800">
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Your Order ID is: <span className="font-mono font-bold bg-blue-100 px-2 py-1 rounded">{orderId}</span></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Screenshot this page or save your Order ID</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>We'll verify your payment within 24 hours</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Scroll down to "Check Order Status" to track your order anytime</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
