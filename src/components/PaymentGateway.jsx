'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, RefreshCw, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function PaymentGateway({ sessionId, qrCodeData, customerData, pricing, onPaymentVerified }) {
    // Payment status state machine
    const [paymentState, setPaymentState] = useState('idle'); // idle, submitted, verifying, verified, failed, expired
    const [copied, setCopied] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [showButton, setShowButton] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);

    const upiId = qrCodeData?.upiId || 'riya4862@airtel';
    const qrCodeImage = qrCodeData?.imageUrl;
    const amount = 600;

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
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    💳 Complete Payment
                </h2>
                <p className="text-5xl font-black text-indigo-600 mb-2">₹{amount}</p>
                <p className="text-gray-600">Booking Fee (Balance ₹{pricing?.balanceDue || 599} on delivery)</p>
            </div>

            {/* Status Badge */}
            <div className={`${statusInfo.color} border-2 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3`}>
                {statusInfo.icon}
                <span className="font-semibold text-gray-800">{statusInfo.text}</span>
            </div>

            {/* QR Code Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 mb-6">
                <p className="text-center text-gray-700 font-semibold mb-4">
                    📱 Scan QR code with any UPI app
                </p>

                <div className="bg-white p-6 inline-block rounded-2xl border-4 border-indigo-600 mx-auto block shadow-lg">
                    {qrCodeImage ? (
                        <img src={qrCodeImage} alt="Payment QR" className="w-64 h-64 mx-auto" />
                    ) : (
                        <QRCodeSVG
                            value={`upi://pay?pa=${upiId}&pn=EliteMarts&am=${amount}&cu=INR`}
                            size={256}
                        />
                    )}
                </div>

                {/* UPI ID */}
                <div className="mt-6">
                    <p className="text-sm font-bold text-gray-700 text-center mb-2">Or pay to UPI ID:</p>
                    <div className="flex items-center justify-center gap-3">
                        <code className="bg-white px-6 py-3 rounded-xl border-2 border-indigo-200 font-mono text-lg font-bold text-indigo-700">
                            {upiId}
                        </code>
                        <button
                            onClick={copyToClipboard}
                            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
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
        </motion.div>
    );
}
