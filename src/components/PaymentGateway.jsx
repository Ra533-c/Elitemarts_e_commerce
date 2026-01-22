'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, RefreshCw, Clock, AlertCircle, CheckCircle, XCircle, ExternalLink, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function PaymentGateway({ sessionId, qrCodeData, customerData, pricing, onPaymentVerified }) {
    // Payment status state machine
    const [paymentState, setPaymentState] = useState('idle'); // idle, submitted, verifying, verified, failed, expired
    const [copied, setCopied] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [instamojoUrl, setInstamojoUrl] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes = 180 seconds
    const [sessionExpired, setSessionExpired] = useState(false);

    const upiId = qrCodeData?.upiId || 'riya4862@airtel';
    const qrCodeImage = qrCodeData?.imageUrl;
    const amount = 100;
    const upiLink = qrCodeData?.data || `upi://pay?pa=${upiId}&pn=EliteMarts&am=${amount}&cu=INR`;

    // Get Instamojo URL from sessionStorage
    useEffect(() => {
        const url = sessionStorage.getItem('instamojoUrl');
        if (url) {
            setInstamojoUrl(url);
        }
    }, []);

    // Auto-poll payment status with optimized timeout
    useEffect(() => {
        if (!sessionId || paymentState === 'verified' || paymentState === 'failed' || paymentState === 'rejected') return;

        let isMounted = true;
        let interval;

        const checkPaymentStatus = async () => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout

                const response = await fetch(`/api/payment/session?sessionId=${sessionId}`, {
                    signal: controller.signal
                });
                clearTimeout(timeout);

                if (!isMounted) return;

                const data = await response.json();

                if (data.success && data.session) {
                    const status = data.session.paymentStatus;

                    if (status === 'verified') {
                        setPaymentState('verified');
                        toast.success('Payment verified! Creating your order... 🎉', { duration: 2000 });

                        // Trigger order creation
                        if (onPaymentVerified) {
                            onPaymentVerified(sessionId);
                        }
                    } else if (status === 'failed') {
                        setPaymentState('failed');
                        toast.error('Payment verification failed');
                    } else if (status === 'rejected') {
                        // Admin rejected payment - STOP POLLING IMMEDIATELY
                        setPaymentState('rejected');
                        isMounted = false; // Stop all further checks
                        if (interval) clearInterval(interval); // Clear interval immediately

                        // Save customer data for auto-fill
                        // customerData is already in the correct format from the form
                        console.log('Saving rejected customer data:', customerData);
                        localStorage.setItem('elitemarts_rejected_customer', JSON.stringify(customerData));

                        toast.error('❌ Payment rejected by admin. Redirecting to retry...', {
                            duration: 3000,
                            icon: '🔄'
                        });

                        // Redirect to home page after 2 seconds
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 2000);
                    } else if (status === 'expired') {
                        setPaymentState('expired');
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

        // Poll every 3 seconds for optimized performance
        interval = setInterval(checkPaymentStatus, 3000);

        return () => {
            isMounted = false;
            if (interval) clearInterval(interval);
        };
    }, [sessionId, paymentState, onPaymentVerified, customerData]);

    // 3-minute countdown timer
    useEffect(() => {
        if (paymentState === 'verified' || paymentState === 'failed' || sessionExpired) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    // Timer expired
                    clearInterval(timer);
                    setSessionExpired(true);
                    setPaymentState('expired');
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
    }, [paymentState, sessionExpired]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(upiId);
        setCopied(true);
        toast.success('UPI ID copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const openUPIApp = (app) => {
        let appLink = '';

        switch (app) {
            case 'phonepe':
                appLink = upiLink.replace('upi://', 'phonepe://');
                break;
            case 'gpay':
                appLink = upiLink.replace('upi://', 'tez://');
                break;
            case 'paytm':
                appLink = upiLink.replace('upi://', 'paytmmp://');
                break;
            default:
                appLink = upiLink;
        }

        window.location.href = appLink;
        toast.success(`Opening ${app}...`);
    };

    const openInstamojo = () => {
        if (instamojoUrl) {
            window.open(instamojoUrl, '_blank');
            toast.success('Redirecting to payment page...');
        } else {
            toast.error('Payment link not available');
        }
    };

    const handlePaymentComplete = async () => {
        if (paymentState === 'submitted' || paymentState === 'verifying') {
            toast('Already submitted! Waiting for admin verification...', {
                icon: '⏳',
                duration: 3000
            });
            return;
        }

        setCheckingStatus(true);
        setPaymentState('submitted');

        try {
            // Update session status to indicate user clicked button
            const response = await fetch('/api/payment/session', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    paymentStatus: 'submitted'
                })
            });

            if (response.ok) {
                toast.success('Payment submitted! Our team will verify within 5-10 minutes. ⏳', {
                    duration: 5000
                });
                setPaymentState('verifying');
            } else {
                toast.error('Failed to submit payment confirmation');
                setPaymentState('idle');
            }
        } catch (error) {
            console.error('Payment submission error:', error);
            toast.error('Failed to submit payment');
            setPaymentState('idle');
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleManualCheck = async () => {
        setCheckingStatus(true);
        try {
            const response = await fetch(`/api/payment/session?sessionId=${sessionId}`);
            const data = await response.json();

            if (data.success && data.session) {
                const status = data.session.paymentStatus;

                if (status === 'verified') {
                    toast.success('Payment verified! 🎉');
                    setPaymentState('verified');
                    if (onPaymentVerified) {
                        onPaymentVerified(sessionId);
                    }
                } else if (status === 'failed') {
                    toast.error('Payment failed');
                    setPaymentState('failed');
                } else if (status === 'submitted' || status === 'verifying') {
                    toast('Payment verification in progress ⏳', {
                        icon: '⏳',
                        duration: 3000
                    });
                } else {
                    toast('Payment still pending. Please complete payment first.', {
                        icon: '💳',
                        duration: 3000
                    });
                }
            }
        } catch (error) {
            console.error('Manual check error:', error);
            toast.error('Failed to check status');
        } finally {
            setCheckingStatus(false);
        }
    };

    // Format time remaining as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Retry payment - generate new session with same customer data
    const handleRetry = async () => {
        setCheckingStatus(true);
        toast.loading('Generating new payment session...', { id: 'retry-toast' });

        try {
            // Create new payment session with same customer data
            const response = await fetch('/api/payment/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: {
                        name: customerData?.name,
                        phone: customerData?.phone,
                        address: customerData?.address?.street || customerData?.address,
                        city: customerData?.address?.city || '',
                        state: customerData?.address?.state || '',
                        pincode: customerData?.address?.pincode || ''
                    },
                    pricing: pricing
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('New payment session created! Timer reset to 3 minutes.', { id: 'retry-toast' });

                // Reload page with new session to get fresh QR code
                // This preserves the customer data in the new session
                setTimeout(() => {
                    window.location.href = `/payment?session=${data.sessionId}`;
                }, 1000);
            } else {
                toast.error('Failed to create new session. Please try again.', { id: 'retry-toast' });
                setCheckingStatus(false);
            }
        } catch (error) {
            console.error('Retry error:', error);
            toast.error('Failed to create new session. Please try again.', { id: 'retry-toast' });
            setCheckingStatus(false);
        }
    };

    // Get status display info
    const getStatusInfo = () => {
        switch (paymentState) {
            case 'idle':
                return {
                    icon: <Clock className="text-blue-600" size={24} />,
                    text: 'Waiting for payment',
                    color: 'bg-blue-50 border-blue-200'
                };
            case 'submitted':
            case 'verifying':
                return {
                    icon: <RefreshCw className="text-yellow-600 animate-spin" size={24} />,
                    text: 'Verifying payment...',
                    color: 'bg-yellow-50 border-yellow-200'
                };
            case 'verified':
                return {
                    icon: <CheckCircle className="text-green-600" size={24} />,
                    text: 'Payment verified!',
                    color: 'bg-green-50 border-green-200'
                };
            case 'failed':
                return {
                    icon: <XCircle className="text-red-600" size={24} />,
                    text: 'Payment failed',
                    color: 'bg-red-50 border-red-200'
                };
            case 'expired':
                return {
                    icon: <AlertCircle className="text-gray-600" size={24} />,
                    text: 'Session expired',
                    color: 'bg-gray-50 border-gray-200'
                };
            default:
                return {
                    icon: <Clock className="text-blue-600" size={24} />,
                    text: 'Waiting for payment',
                    color: 'bg-blue-50 border-blue-200'
                };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-2xl mx-auto"
        >
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                    Complete Payment to Order
                </h2>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-4 mb-3">
                    <p className="text-sm font-semibold mb-1">Booking Amount</p>
                    <p className="text-4xl md:text-5xl font-black">₹{amount}</p>
                </div>
                <p className="text-sm text-gray-600">
                    ₹100 prepaid to order • ₹{pricing?.balanceDue || 1099} Cash On Delivery
                </p>

                {/* Timer Display */}
                {!sessionExpired && paymentState !== 'verified' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 p-3 rounded-xl border-2 ${timeRemaining > 60
                            ? 'bg-green-50 border-green-300'
                            : timeRemaining > 30
                                ? 'bg-yellow-50 border-yellow-300'
                                : 'bg-red-50 border-red-300 animate-pulse'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Clock className={`${timeRemaining > 60
                                ? 'text-green-600'
                                : timeRemaining > 30
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`} size={20} />
                            <p className={`font-bold text-lg ${timeRemaining > 60
                                ? 'text-green-700'
                                : timeRemaining > 30
                                    ? 'text-yellow-700'
                                    : 'text-red-700'
                                }`}>
                                Time Remaining: {formatTime(timeRemaining)}
                            </p>
                        </div>
                        <p className="text-xs text-center mt-1 text-gray-600">
                            Complete payment within this time
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Expired Session - Retry UI */}
            {sessionExpired && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 bg-red-50 border-2 border-red-300 rounded-2xl p-6 text-center"
                >
                    <AlertCircle className="mx-auto mb-3 text-red-600" size={48} />
                    <h3 className="text-xl font-bold text-red-900 mb-2">Payment Time Expired!</h3>
                    <p className="text-red-700 mb-4">
                        Your 3-minute payment window has expired. Please try again to get a new QR code.
                    </p>
                    <button
                        onClick={handleRetry}
                        className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:from-red-700 hover:to-pink-700 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto"
                    >
                        <RefreshCw size={20} />
                        Try Again - Get New QR Code
                    </button>
                </motion.div>
            )}

            {/* Status Badge with Animation */}
            <motion.div
                className={`${statusInfo.color} border-2 rounded-xl p-3 mb-6 flex items-center justify-center gap-2`}
                animate={{ scale: paymentState === 'verifying' ? [1, 1.02, 1] : 1 }}
                transition={{ repeat: paymentState === 'verifying' ? Infinity : 0, duration: 1.5 }}
            >
                {statusInfo.icon}
                <span className="font-semibold text-sm md:text-base text-gray-800">{statusInfo.text}</span>
            </motion.div>

            {/* Processing Messages */}
            {
                (paymentState === 'submitted' || paymentState === 'verifying') && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <p className="text-sm font-semibold text-blue-900">Processing your payment...</p>
                        </div>
                        <div className="space-y-2 text-xs text-blue-700">
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="flex items-center gap-2"
                            >
                                <span className="text-green-600">✓</span> Payment session created
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="flex items-center gap-2"
                            >
                                <span className="text-green-600">✓</span> Admin notified instantly
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                                className="flex items-center gap-2"
                            >
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                Waiting for admin verification...
                            </motion.p>
                        </div>
                        <p className="text-xs text-blue-600 mt-3 font-medium">⚡ Auto-checking every second for instant updates</p>
                    </motion.div>
                )
            }

            {/* QR Code Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 md:p-8 mb-6">
                <p className="text-center text-gray-700 font-semibold mb-4 text-sm md:text-base">
                    📱 Scan QR Code with any UPI app
                </p>

                {/* QR Code - Centered */}
                <div className="flex justify-center mb-6">
                    <div className="bg-white p-4 md:p-6 rounded-2xl border-4 border-indigo-600 shadow-xl">
                        {qrCodeImage ? (
                            <img src={qrCodeImage} alt="Payment QR" className="w-48 h-48 md:w-64 md:h-64" />
                        ) : (
                            <QRCodeSVG
                                value={upiLink}
                                size={typeof window !== 'undefined' && window.innerWidth < 768 ? 192 : 256}
                            />
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-gradient-to-br from-indigo-50 to-purple-50 px-4 text-sm font-bold text-gray-600">OR</span>
                    </div>
                </div>

                {/* UPI ID */}
                <div>
                    <p className="text-sm font-bold text-gray-700 text-center mb-3">Pay to UPI ID:</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <code className="bg-white px-4 md:px-6 py-3 rounded-xl border-2 border-indigo-200 font-mono text-base md:text-lg font-bold text-indigo-700 break-all text-center">
                            {upiId}
                        </code>
                        <button
                            onClick={copyToClipboard}
                            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
                            title="Copy UPI ID"
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Pay Now Button - Opens UPI App (Mobile Only) */}
            <button
                onClick={() => {
                    // Check if mobile device
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                    if (isMobile) {
                        window.location.href = upiLink;
                        toast.success('Opening UPI app...');
                    } else {
                        toast('Please scan the QR code below with your phone', {
                            icon: '📱',
                            duration: 4000
                        });
                    }
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-2xl font-bold text-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl flex items-center justify-center gap-3 mb-4"
            >
                <Smartphone size={24} />
                Pay Now
            </button>

            {/* Desktop Message */}
            {
                typeof window !== 'undefined' && !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-yellow-800 text-center">
                            📱 <strong>On Desktop?</strong> Scan the QR code below with your phone's UPI app
                        </p>
                    </div>
                )
            }

            {/* Instamojo Button - Secondary */}
            {
                instamojoUrl && (
                    <button
                        onClick={openInstamojo}
                        className="w-full bg-white text-indigo-700 border-2 border-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 mb-6"
                    >
                        <ExternalLink size={18} />
                        Pay via Instamojo (Instant Auto-Verification)
                    </button>
                )
            }

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 text-center font-semibold mb-2">
                    💡 After Payment
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>✅ <strong>Instamojo:</strong> Instant automatic verification</li>
                    <li>📱 <strong>UPI Payment:</strong> Admin gets instant Telegram notification</li>
                    <li>⏱️ <strong>Admin verifies:</strong> Within 5-10 minutes</li>
                    <li>🔄 <strong>Auto-updates:</strong> Every 3 seconds</li>
                </ul>
            </div>

            {/* Customer Info */}
            <div className="mt-6 text-center text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-2">Order Details</p>
                <p><strong>Name:</strong> {customerData?.name}</p>
                <p><strong>Phone:</strong> {customerData?.phone}</p>
                <p className="text-xs text-gray-500 mt-2">Session ID: {sessionId?.slice(-8)}</p>
            </div>
        </motion.div>
    );
}
