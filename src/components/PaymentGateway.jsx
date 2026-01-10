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
    const [countdown, setCountdown] = useState(60);
    const [showButton, setShowButton] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [instamojoUrl, setInstamojoUrl] = useState('');

    const upiId = qrCodeData?.upiId || 'riya4862@airtel';
    const qrCodeImage = qrCodeData?.imageUrl;
    const amount = 600;
    const upiLink = qrCodeData?.data || `upi://pay?pa=${upiId}&pn=EliteMarts&am=${amount}&cu=INR`;

    // Get Instamojo URL from sessionStorage
    useEffect(() => {
        const url = sessionStorage.getItem('instamojoUrl');
        if (url) {
            setInstamojoUrl(url);
        }
    }, []);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0 && !showButton) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setShowButton(true);
        }
    }, [countdown, showButton]);

    // Auto-poll payment status every 10 seconds
    useEffect(() => {
        if (!sessionId || paymentState === 'verified' || paymentState === 'failed') return;

        const checkPaymentStatus = async () => {
            try {
                const response = await fetch(`/api/payment/session?sessionId=${sessionId}`);
                const data = await response.json();

                if (data.success && data.session) {
                    const status = data.session.paymentStatus;

                    if (status === 'verified') {
                        setPaymentState('verified');
                        toast.success('Payment verified! Creating your order... 🎉');

                        // Trigger order creation
                        if (onPaymentVerified) {
                            onPaymentVerified(sessionId);
                        }
                    } else if (status === 'failed') {
                        setPaymentState('failed');
                        toast.error('Payment verification failed');
                    } else if (status === 'expired') {
                        setPaymentState('expired');
                        toast.error('Payment session expired');
                    }
                }
            } catch (error) {
                console.error('Status check failed:', error);
            }
        };

        // Initial check
        checkPaymentStatus();

        // Poll every 10 seconds
        const interval = setInterval(checkPaymentStatus, 10000);
        return () => clearInterval(interval);
    }, [sessionId, paymentState, onPaymentVerified]);

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
                    ₹600 prepaid to order • ₹{pricing?.balanceDue || 599} Cash On Delivery
                </p>
            </div>

            {/* Status Badge */}
            <div className={`${statusInfo.color} border-2 rounded-xl p-3 mb-6 flex items-center justify-center gap-2`}>
                {statusInfo.icon}
                <span className="font-semibold text-sm md:text-base text-gray-800">{statusInfo.text}</span>
            </div>

            {/* Pay Now Button - Primary */}
            {instamojoUrl && (
                <button
                    onClick={openInstamojo}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-2xl font-bold text-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl flex items-center justify-center gap-3 mb-6"
                >
                    <ExternalLink size={24} />
                    Pay Now ₹600
                </button>
            )}

            {/* QR Code Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 md:p-8">
                <p className="text-center text-gray-700 font-semibold mb-4 text-sm md:text-base">
                    📱 Or Scan QR Code with any UPI app
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

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
                {/* I've Completed Payment Button */}
                <button
                    onClick={handlePaymentComplete}
                    disabled={checkingStatus || paymentState === 'verified' || !showButton}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {checkingStatus ? (
                        <>
                            <RefreshCw className="animate-spin" size={20} />
                            Submitting...
                        </>
                    ) : paymentState === 'verified' ? (
                        <>
                            <CheckCircle size={20} />
                            Payment Verified!
                        </>
                    ) : (
                        <>
                            <CheckCircle size={20} />
                            I've Completed Payment
                        </>
                    )}
                </button>

                {!showButton && (
                    <p className="text-sm text-center text-gray-600">
                        Button appears in <span className="font-bold text-indigo-600">{countdown}s</span>
                    </p>
                )}

                {/* Manual Check Button */}
                <button
                    onClick={handleManualCheck}
                    disabled={checkingStatus}
                    className="w-full bg-white text-indigo-700 border-2 border-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                >
                    <RefreshCw size={18} className={checkingStatus ? 'animate-spin' : ''} />
                    Check Payment Status
                </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 text-center">
                    ⚡ Auto-checking every 10 seconds • Admin verification within 5-10 minutes
                </p>
            </div>

            {/* Customer Info */}
            <div className="mt-6 text-center text-sm text-gray-600">
                <p><strong>Name:</strong> {customerData?.name}</p>
                <p><strong>Phone:</strong> {customerData?.phone}</p>
            </div>
        </motion.div >
    );
}
