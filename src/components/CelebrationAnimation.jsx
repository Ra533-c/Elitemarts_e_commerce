'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Package } from 'lucide-react';
import { generateClientInvoice } from '@/lib/clientInvoice';
import toast from 'react-hot-toast';

export default function CelebrationAnimation({ orderId, orderData, onClose }) {
    useEffect(() => {
        // Trigger confetti animation
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Fire confetti from both sides
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const handleDownloadInvoice = async () => {
        try {
            await generateClientInvoice(orderData);
            toast.success('Invoice downloaded successfully!');
        } catch (error) {
            toast.error('Failed to download invoice');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mb-6"
                >
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                        <CheckCircle size={56} className="text-white" />
                    </div>
                </motion.div>

                {/* Success Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h1 className="text-3xl font-black text-gray-900 mb-2">
                        🎉 Order Placed Successfully!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Your robotic massager is on its way!
                    </p>
                </motion.div>

                {/* Order Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6"
                >
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Package className="text-indigo-600" size={24} />
                        <p className="text-sm font-semibold text-gray-700">Order ID</p>
                    </div>
                    <p className="font-mono font-bold text-2xl text-indigo-700 mb-4">
                        {orderId}
                    </p>

                    <div className="text-left space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Booking Amount:</span>
                            <span className="font-bold text-green-600">₹600 Paid ✓</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Balance on Delivery:</span>
                            <span className="font-bold text-gray-900">₹{orderData?.pricing?.balanceDue || 1099}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-3"
                >
                    <button
                        onClick={handleDownloadInvoice}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Download size={20} />
                        Download Invoice
                    </button>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    )}
                </motion.div>

                {/* Success Note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-xs text-gray-500 mt-6"
                >
                    You'll receive a confirmation SMS shortly
                </motion.p>
            </motion.div>
        </motion.div>
    );
}
