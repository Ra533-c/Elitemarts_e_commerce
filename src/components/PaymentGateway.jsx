'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Smartphone, Info, AlertCircle, Monitor, Download, CheckCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { generateClientInvoice } from '@/lib/clientInvoice';

export default function PaymentGateway({ orderId, amount = 600, orderData, pricing, onPaymentComplete }) {
    const [copied, setCopied] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [countdown, setCountdown] = useState(60); // 60 second timer
    const [showButton, setShowButton] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, verified, failed
    const [pollingInterval, setPollingInterval] = useState(null);

    const upiId = 'riya4862@airtel';
    const upiLink = `upi://pay?pa=${upiId}&pn=EliteMarts&am=${amount}&cu=INR&tn=Order ${orderId}`;

    // Countdown timer effect
    useEffect(() => {
        if (countdown > 0 && !showButton) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setShowButton(true);
        }
    }, [countdown, showButton]);

    // Poll payment status every 5 seconds
    useEffect(() => {
        if (!orderId || paymentCompleted) return;

        const checkPaymentStatus = async () => {
            try {
                const response = await fetch(`/api/order/status?orderId=${orderId}`);
                const data = await response.json();

                if (data.order) {
                    const status = data.order.paymentStatus || 'pending';
                    setPaymentStatus(status);

                    if (status === 'verified') {
                        setPaymentCompleted(true);
                        localStorage.setItem(`payment_${orderId}`, 'completed');
                        if (onPaymentComplete) {
                            onPaymentComplete(orderId);
                        }
                        // Clear polling
                        if (pollingInterval) {
                            clearInterval(pollingInterval);
                        }
                    } else if (status === 'failed') {
                        // Payment was rejected
                        if (pollingInterval) {
                            clearInterval(pollingInterval);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to check payment status:', error);
            }
        };

        // Initial check
        checkPaymentStatus();

        // Set up polling every 5 seconds
        const interval = setInterval(checkPaymentStatus, 5000);
        setPollingInterval(interval);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [orderId, paymentCompleted, onPaymentComplete]);

    useEffect(() => {
        // Detect if device is mobile
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
            return mobileKeywords.some(keyword => userAgent.includes(keyword)) || window.innerWidth < 768;
        };

        setIsMobile(checkMobile());

        // Check if payment was already completed for this order
        if (orderId) {
            const savedPaymentStatus = localStorage.getItem(`payment_${orderId}`);
            if (savedPaymentStatus === 'completed') {
                setPaymentCompleted(true);
                setPaymentStatus('verified');
            }
        }
    }, [orderId]);

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

    const handlePaymentComplete = async () => {
        setCheckingStatus(true);
        try {
            // Update payment status to pending verification
            const response = await fetch('/api/order/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderId,
                    paymentStatus: 'pending'
                })
            });

            if (response.ok) {
                toast.success('Payment submitted! Waiting for verification... ⏳', {
                    duration: 4000
                });
                // Start showing "waiting for verification" state
                setPaymentStatus('pending');
            } else {
                toast.error('Failed to update payment status');
            }
        } catch (error) {
            console.error('Payment status update failed:', error);
            toast.error('Failed to update payment status');
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleRetryPayment = () => {
        // Reset states for retry
        setPaymentStatus('pending');
        setCountdown(60);
        setShowButton(false);
        toast.info('Please complete the payment again');
    };

    const handleDownloadInvoice = async () => {
        if (!paymentCompleted) {
            toast.error('Please complete payment first to download invoice');
            return;
        }

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
            toast.success('Invoice downloaded successfully! 📄');
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
            {/* Payment Status Header */}
            <div className={`text-white p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 ${paymentCompleted ? 'bg-gradient-to-br from-green-600 to-emerald-600' : 'bg-gradient-to-br from-indigo-600 to-purple-600'}`}>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                    {paymentCompleted ? 'Payment Complete! 🎉' : 'Pay Booking Fee'}
                </h2>
                <p className="text-4xl sm:text-5xl font-black mb-2">₹{amount}</p>
                <p className={`${paymentCompleted ? 'text-green-100' : 'text-indigo-100'} text-sm sm:text-base`}>
                    Order ID: <span className="font-mono font-bold">{orderId}</span>
                </p>
                {paymentCompleted && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                        <CheckCircle size={24} className="text-green-200" />
                        <span className="text-green-200 font-semibold">Payment Verified</span>
                    </div>
                )}
            </div>

            {!paymentCompleted ? (
                <>
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
                                        <span>After payment, click "I've Completed Payment" button below</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold shrink-0">5.</span>
                                        <span>You'll be redirected back and can download your invoice</span>
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

                    {/* Payment Complete Button - Show Only After Timer */}
                    {paymentStatus === 'pending' && !paymentCompleted && (
                        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
                            {!showButton ? (
                                <div className="text-center">
                                    <div className="mb-4">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mb-3">
                                            <span className="text-3xl font-bold text-white">{countdown}</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 font-semibold mb-2">
                                        ⏱️ Please complete your payment
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Button will appear in <span className="font-bold text-indigo-600">{countdown} seconds</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        This ensures you have time to complete the payment
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={handlePaymentComplete}
                                        disabled={checkingStatus}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 sm:py-4 rounded-2xl flex items-center justify-center gap-3 hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl disabled:opacity-50"
                                    >
                                        {checkingStatus ? (
                                            <>
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={24} />
                                                I've Completed Payment
                                            </>
                                        )}
                                    </button>
                                    <p className="text-xs text-green-700 mt-2 text-center">
                                        ✅ Click this after making the ₹{amount} payment
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Waiting for Verification State */}
                    {paymentStatus === 'pending' && checkingStatus && (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
                            <div className="text-center">
                                <div className="animate-pulse mb-3">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-yellow-800 mb-2">Verifying Payment... ⏳</h3>
                                <p className="text-yellow-700 text-sm">
                                    We're checking if your payment of ₹{amount} was received.
                                </p>
                                <p className="text-yellow-600 text-xs mt-2">
                                    This usually takes a few seconds. Please wait...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Payment Failed State */}
                    {paymentStatus === 'failed' && (
                        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
                            <div className="text-center">
                                <AlertCircle size={48} className="text-red-600 mx-auto mb-3" />
                                <h3 className="text-xl font-bold text-red-800 mb-2">Payment Failed ❌</h3>
                                <p className="text-red-700 mb-4">
                                    We couldn't verify your ₹{amount} payment. Please try again.
                                </p>
                                <button
                                    onClick={handleRetryPayment}
                                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 sm:py-4 rounded-2xl flex items-center justify-center gap-3 hover:from-red-700 hover:to-rose-700 transition-all font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl"
                                >
                                    <Package size={24} />
                                    Pay Again
                                </button>
                                <p className="text-xs text-red-600 mt-2">
                                    Make sure to pay exactly ₹{amount} to the UPI ID above
                                </p>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Payment Completed - Show Invoice Download */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
                        <div className="text-center mb-4">
                            <CheckCircle size={48} className="text-green-600 mx-auto mb-3" />
                            <h3 className="text-xl font-bold text-green-800 mb-2">Payment Verified! ✅</h3>
                            <p className="text-green-700">Your payment of ₹{amount} has been confirmed. Download your invoice below.</p>
                        </div>

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
                </>
            )}

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
                                <span>Click "I've Completed Payment" to update your status</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>You'll be redirected back to download your invoice</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Check status anytime using "Check Order Status" section below</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
