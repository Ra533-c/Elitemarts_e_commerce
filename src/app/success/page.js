'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');
    const [status, setStatus] = useState('processing'); // processing, success, error

    useEffect(() => {
        if (orderId) {
            // Save to localStorage for persistence
            localStorage.setItem('eliteOrderId', orderId);
            localStorage.setItem('eliteOrderStatus', 'completed');

            // Update order status in DB
            const updateStatus = async () => {
                try {
                    const response = await fetch('/api/order/status', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderId,
                            paymentStatus: 'verified'
                        })
                    });

                    if (response.ok) {
                        setStatus('success');
                        toast.success('Payment verified successfully!');

                        // Redirect after 3 seconds
                        setTimeout(() => {
                            window.location.href = '/?status=success&order_id=' + orderId;
                        }, 3000);
                    } else {
                        setStatus('error');
                    }
                } catch (error) {
                    console.error('Update failed:', error);
                    setStatus('error');
                }
            };

            updateStatus();
        } else {
            setStatus('error');
        }
    }, [orderId]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
            >
                {status === 'processing' && (
                    <>
                        <Loader2 className="animate-spin mx-auto mb-6 text-green-600" size={64} />
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifying Payment...</h1>
                        <p className="text-gray-600">Please wait while we confirm your payment.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="mx-auto mb-6 text-green-600" size={64} />
                        <h1 className="text-2xl font-bold text-green-800 mb-4">Payment Verified! 🎉</h1>
                        <p className="text-green-700">Order ID: <span className="font-mono font-bold">{orderId}</span></p>
                        <p className="text-gray-600 mt-4">Redirecting to home page...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="mx-auto mb-6 text-red-600" size={64} />
                        <h1 className="text-2xl font-bold text-red-800 mb-4">Verification Failed</h1>
                        <p className="text-red-700">Please contact support with Order ID: {orderId || 'N/A'}</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Return to Home
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
