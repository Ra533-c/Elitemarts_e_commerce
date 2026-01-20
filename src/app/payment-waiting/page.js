'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, Copy, Check, Smartphone, PartyPopper, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import PageTransition from '@/components/PageTransition';
import { getPaymentSession, clearPaymentSession } from '@/lib/usePaymentSession';
import { generateClientInvoice } from '@/lib/clientInvoice';

export default function PaymentWaitingPage() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [paymentState, setPaymentState] = useState('waiting'); // waiting, verifying, verified, rejected, expired
    const [timeRemaining, setTimeRemaining] = useState(180);
    const [copied, setCopied] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [orderIdCopied, setOrderIdCopied] = useState(false);
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
    const loaderRef = useRef(null);
    const confettiTriggeredRef = useRef(false); // Prevent duplicate confetti

    const upiId = 'riya4862@airtel';
    const amount = 600;
    const upiLink = `upi://pay?pa=${upiId}&pn=EliteMarts&am=${amount}&cu=INR`;

    // Load session on mount
    useEffect(() => {
        const storedSession = getPaymentSession();
        if (!storedSession) {
            toast.error('No active payment session found');
            router.push('/');
            return;
        }
        setSession(storedSession);
    }, [router]);

    // GSAP loader animation
    useEffect(() => {
        if (loaderRef.current && paymentState === 'waiting') {
            gsap.to('.pulse-ring', {
                scale: 1.5,
                opacity: 0,
                duration: 1.5,
                repeat: -1,
                ease: 'power2.out',
            });
        }
    }, [paymentState]);

    // Auto-poll payment status
    useEffect(() => {
        if (!session?.sessionId || paymentState === 'verified' || paymentState === 'rejected') return;

        let isMounted = true;
        let interval;

        const checkPaymentStatus = async () => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 2000);

                const response = await fetch(`/api/payment/session?sessionId=${session.sessionId}`, {
                    signal: controller.signal
                });
                clearTimeout(timeout);

                if (!isMounted) return;

                const data = await response.json();

                if (data.success && data.session) {
                    const status = data.session.paymentStatus;

                    if (status === 'verified') {
                        setPaymentState('verified');

                        // Create order via API
                        try {
                            const orderResponse = await fetch('/api/payment/verify-and-create', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ sessionId: session.sessionId })
                            });
                            const orderResult = await orderResponse.json();

                            if (orderResult.success && orderResult.orderId) {
                                setOrderId(orderResult.orderId);
                                localStorage.setItem('elitemarts_lastOrderId', orderResult.orderId);
                            }
                        } catch (err) {
                            console.error('Order creation error:', err);
                        }

                        clearPaymentSession();

                        // Trigger confetti celebration!
                        confetti({
                            particleCount: 150,
                            spread: 100,
                            origin: { y: 0.6 }
                        });
                        setTimeout(() => {
                            confetti({
                                particleCount: 100,
                                spread: 120,
                                origin: { y: 0.5, x: 0.3 }
                            });
                        }, 300);
                        setTimeout(() => {
                            confetti({
                                particleCount: 100,
                                spread: 120,
                                origin: { y: 0.5, x: 0.7 }
                            });
                        }, 500);

                        toast.success('🎉 Payment Verified! Order Created!', { duration: 4000 });
                    } else if (status === 'failed') {
                        setPaymentState('failed');
                        toast.error('Payment failed');
                    } else if (status === 'rejected') {
                        setPaymentState('rejected');
                        isMounted = false;
                        if (interval) clearInterval(interval);

                        // Save customer data for auto-fill
                        localStorage.setItem('elitemarts_rejected_customer', JSON.stringify(session.customerData));
                        clearPaymentSession();

                        toast.error('❌ Payment rejected. Redirecting to retry...', {
                            duration: 3000,
                            icon: '🔄'
                        });

                        setTimeout(() => {
                            router.push('/order');
                        }, 2000);
                    } else if (status === 'expired') {
                        setPaymentState('expired');
                        clearPaymentSession();
                        toast.error('Payment session expired');
                    }
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Status check timed out, retrying...');
                } else {
                    console.error('Status check failed:', error);
                }
            }
        };

        // Initial check
        checkPaymentStatus();

        // Poll every 1 second for INSTANT updates (faster than 3 seconds)
        interval = setInterval(checkPaymentStatus, 1000);

        return () => {
            isMounted = false;
            if (interval) clearInterval(interval);
        };
    }, [session?.sessionId, paymentState, router, session?.customerData]);

    // INSTANT CONFETTI: Trigger immediately when verified (no delay!)
    useEffect(() => {
        if (paymentState === 'verified' && !confettiTriggeredRef.current) {
            confettiTriggeredRef.current = true; // Prevent duplicate triggers

            // Immediate confetti burst!
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 }
            });
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    spread: 120,
                    origin: { y: 0.5, x: 0.3 }
                });
            }, 200);
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    spread: 120,
                    origin: { y: 0.5, x: 0.7 }
                });
            }, 400);
        }
    }, [paymentState]);

    // Countdown timer
    useEffect(() => {
        if (paymentState === 'verified' || paymentState === 'rejected') return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setPaymentState('expired');
                    clearPaymentSession();
                    toast.error('Payment time expired! Please try again.', {
                        duration: 5000,
                        icon: '⏰'
                    });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [paymentState]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(upiId);
        setCopied(true);
        toast.success('UPI ID copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const openUPIApp = () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            window.location.href = upiLink;
            toast.success('Opening UPI app...');
        } else {
            toast('Please scan the QR code with your phone', { icon: '📱', duration: 4000 });
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setIsDownloadingPDF(true);

            const invoiceData = {
                orderId: orderId,
                customerName: session?.customerData?.name,
                phone: session?.customerData?.phone,
                email: session?.customerData?.email || 'N/A',
                address: session?.customerData?.address,
                pricing: session?.pricing
            };

            await generateClientInvoice(invoiceData);
            toast.success('📄 Invoice downloaded!');
        } catch (error) {
            console.error('PDF download error:', error);
            toast.error('Failed to generate invoice. Please try again.');
        } finally {
            setIsDownloadingPDF(false);
        }
    };

    const handleBack = () => {
        clearPaymentSession();
        router.push('/');
    };

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <PageTransition>
            <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Back Button */}
                    <motion.button
                        onClick={handleBack}
                        whileHover={{ scale: 1.02, x: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors font-medium mb-6 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Cancel & Go Back</span>
                    </motion.button>

                    {/* Main Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-2xl p-6 md:p-8"
                    >
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                Complete Your Payment
                            </h1>
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-4 mb-3">
                                <p className="text-sm font-semibold mb-1">Booking Amount</p>
                                <p className="text-4xl md:text-5xl font-black">₹{amount}</p>
                            </div>
                            <p className="text-sm text-gray-600">
                                ₹600 prepaid • ₹{session.pricing?.balanceDue || 599} Cash On Delivery
                            </p>
                        </div>

                        {/* Timer */}
                        {paymentState !== 'verified' && paymentState !== 'rejected' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mb-6 p-3 rounded-xl border-2 ${timeRemaining > 60
                                    ? 'bg-green-50 border-green-300'
                                    : timeRemaining > 30
                                        ? 'bg-yellow-50 border-yellow-300'
                                        : 'bg-red-50 border-red-300 animate-pulse'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Clock
                                        className={
                                            timeRemaining > 60
                                                ? 'text-green-600'
                                                : timeRemaining > 30
                                                    ? 'text-yellow-600'
                                                    : 'text-red-600'
                                        }
                                        size={20}
                                    />
                                    <p className={`font-bold text-lg ${timeRemaining > 60
                                        ? 'text-green-700'
                                        : timeRemaining > 30
                                            ? 'text-yellow-700'
                                            : 'text-red-700'
                                        }`}>
                                        Time Remaining: {formatTime(timeRemaining)}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Status Display */}
                        <AnimatePresence mode="wait">
                            {paymentState === 'waiting' && (
                                <motion.div
                                    key="waiting"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6"
                                >
                                    <div className="flex items-center gap-3">
                                        <div ref={loaderRef} className="relative">
                                            <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                            <div className="pulse-ring absolute inset-0 w-6 h-6 border-2 border-blue-400 rounded-full" />
                                        </div>
                                        <p className="text-blue-800 font-semibold">Waiting for payment verification...</p>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-2">
                                        ⚡ Auto-checking every second for instant updates
                                    </p>
                                </motion.div>
                            )}

                            {paymentState === 'verified' && (
                                <motion.div
                                    key="verified"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8 mb-6 text-center"
                                >
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 0.5, repeat: 3 }}
                                    >
                                        <PartyPopper className="mx-auto mb-4 text-green-600" size={64} />
                                    </motion.div>

                                    <h2 className="text-3xl font-black text-green-900 mb-2">🎉 Payment Verified!</h2>
                                    <p className="text-green-700 text-lg mb-6">Thank you for your order!</p>

                                    {orderId && (
                                        <div className="bg-white rounded-xl p-4 mb-6 border-2 border-green-200">
                                            <p className="text-sm text-gray-600 mb-2">Your Order ID</p>
                                            <div className="flex items-center justify-center gap-3">
                                                <code className="text-xl font-bold text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg">
                                                    {orderId}
                                                </code>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(orderId);
                                                        setOrderIdCopied(true);
                                                        toast.success('Order ID copied!');
                                                        setTimeout(() => setOrderIdCopied(false), 2000);
                                                    }}
                                                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                                >
                                                    {orderIdCopied ? <Check size={20} /> : <Copy size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-6">
                                        <p className="text-yellow-800 font-semibold text-sm">📦 Expected Delivery: 4-6 Business Days</p>
                                        <p className="text-yellow-700 text-xs mt-1">You'll receive SMS updates on your order status</p>
                                    </div>

                                    <p className="text-gray-600 text-sm mb-6">
                                        ₹{session?.pricing?.balanceDue || 599} will be collected on delivery
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                                        <button
                                            onClick={handleDownloadPDF}
                                            disabled={isDownloadingPDF || !orderId}
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isDownloadingPDF ? (
                                                <>
                                                    <Loader2 size={20} className="animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={20} />
                                                    Download Invoice
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => router.push('/')}
                                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-full font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                                        >
                                            ✓ Done - Go to Home
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {paymentState === 'rejected' && (
                                <motion.div
                                    key="rejected"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6 text-center"
                                >
                                    <XCircle className="mx-auto mb-3 text-red-600" size={48} />
                                    <h3 className="text-xl font-bold text-red-900">Payment Rejected</h3>
                                    <p className="text-red-700">Redirecting to retry with your saved details...</p>
                                </motion.div>
                            )}

                            {paymentState === 'expired' && (
                                <motion.div
                                    key="expired"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6 mb-6 text-center"
                                >
                                    <AlertCircle className="mx-auto mb-3 text-gray-600" size={48} />
                                    <h3 className="text-xl font-bold text-gray-900">Session Expired</h3>
                                    <p className="text-gray-700 mb-4">Please go back and try again.</p>
                                    <button
                                        onClick={handleBack}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
                                    >
                                        Try Again
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* QR Code Section */}
                        {paymentState !== 'verified' && paymentState !== 'rejected' && paymentState !== 'expired' && (
                            <>
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
                                    <p className="text-center text-gray-700 font-semibold mb-4">
                                        📱 Scan QR Code with any UPI app
                                    </p>

                                    <div className="flex justify-center mb-4">
                                        <div className="bg-white p-4 rounded-2xl border-4 border-indigo-600 shadow-xl">
                                            <QRCodeSVG value={upiLink} size={200} />
                                        </div>
                                    </div>

                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t-2 border-gray-300"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-gradient-to-br from-indigo-50 to-purple-50 px-4 text-sm font-bold text-gray-600">OR</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-gray-700 text-center mb-3">Pay to UPI ID:</p>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                            <code className="bg-white px-4 py-3 rounded-xl border-2 border-indigo-200 font-mono text-lg font-bold text-indigo-700">
                                                {upiId}
                                            </code>
                                            <button
                                                onClick={copyToClipboard}
                                                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
                                            >
                                                {copied ? <Check size={20} /> : <Copy size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Pay Now Button */}
                                <button
                                    onClick={openUPIApp}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-2xl font-bold text-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl flex items-center justify-center gap-3 mb-4"
                                >
                                    <Smartphone size={24} />
                                    Pay Now
                                </button>

                                {/* Info */}
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                    <p className="text-sm text-blue-800 text-center font-semibold mb-2">
                                        💡 After Payment
                                    </p>
                                    <ul className="text-xs text-blue-700 space-y-1">
                                        <li>📱 <strong>UPI Payment:</strong> Admin gets instant Telegram notification</li>
                                        <li>⏱️ <strong>Admin verifies:</strong> Within 5-10 minutes</li>
                                        <li>🔄 <strong>Auto-updates:</strong> Every 3 seconds</li>
                                    </ul>
                                </div>
                            </>
                        )}

                        {/* Customer Info */}
                        <div className="mt-6 text-center text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
                            <p className="font-semibold text-gray-800 mb-2">Order Details</p>
                            <p><strong>Name:</strong> {session.customerData?.name}</p>
                            <p><strong>Phone:</strong> {session.customerData?.phone}</p>
                            <p className="text-xs text-gray-500 mt-2">Session ID: {session.sessionId?.slice(-8)}</p>
                        </div>
                    </motion.div>
                </div>
            </main>
        </PageTransition>
    );
}
