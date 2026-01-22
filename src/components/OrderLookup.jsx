'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, CheckCircle, Clock, XCircle, RefreshCw, Download, MapPin, Phone, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateClientInvoice } from '@/lib/clientInvoice';

export default function OrderLookup() {
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [pollingInterval, setPollingInterval] = useState(null);

    // Note: Removed auto-loading to prevent showing order on every refresh
    // Order will only display when user manually searches


    // Clean up polling on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, [pollingInterval]);

    const getStatusIcon = (status, paymentStatus) => {
        const baseClass = "w-8 h-8";
        if (paymentStatus === 'verified' || paymentStatus === 'paid') {
            return <CheckCircle className={`${baseClass} text-green-500`} />;
        }
        if (paymentStatus === 'failed') {
            return <XCircle className={`${baseClass} text-red-500`} />;
        }
        return <Clock className={`${baseClass} text-yellow-500 animate-pulse`} />;
    };

    const checkStatus = useCallback(async (id, isAuto = false) => {
        try {
            const response = await fetch(`/api/order/status?orderId=${id}`);
            const data = await response.json();

            if (response.ok && data.order) {
                setOrderData(data.order);

                // Stop polling if verified
                if (data.order.paymentStatus === 'verified' || data.order.paymentStatus === 'paid') {
                    if (pollingInterval) {
                        clearInterval(pollingInterval);
                        setPollingInterval(null);
                    }
                    if (isAuto) {
                        toast.success('Payment Verified! ✅', { duration: 3000 });
                    }
                }
                return true;
            } else if (!isAuto) {
                toast.error('Order not found');
                setOrderData(null);
            }
            return false;
        } catch (error) {
            console.error('Status check failed:', error);
            if (!isAuto) toast.error('Failed to check status');
            return false;
        }
    }, [pollingInterval]);

    const startPolling = useCallback((id) => {
        if (pollingInterval) clearInterval(pollingInterval);

        const interval = setInterval(() => {
            checkStatus(id, true);
        }, 5000); // Check every 5 seconds

        setPollingInterval(interval);
    }, [pollingInterval, checkStatus]);

    const handleLookup = async (e, predefinedId = null) => {
        if (e) e.preventDefault();

        const searchId = predefinedId || orderId.trim();
        if (!searchId) {
            toast.error('Please enter Order ID');
            return;
        }

        setLoading(true);
        if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
        }

        const found = await checkStatus(searchId, false);
        if (found) {
            startPolling(searchId);
        }

        setLoading(false);
    };

    const handleDownloadInvoice = async () => {
        if (!orderData) return;
        try {
            await generateClientInvoice(orderData);
            toast.success('Invoice downloaded!');
        } catch (error) {
            toast.error('Failed to download invoice');
        }
    };

    // Animated progress calculation with automatic status updates
    const getDeliveryProgress = () => {
        if (!orderData?.createdAt) return { progress: 0, text: 'Processing', status: 'processing' };

        // Calculate days since order creation
        const daysSinceOrder = Math.floor((Date.now() - new Date(orderData.createdAt).getTime()) / (1000 * 60 * 60 * 24));

        // Auto-update delivery status based on days
        // Day 0-1: Processing, Day 2-3: Shipped, Day 4-5: Out for Delivery, Day 6+: Delivered
        let currentStatus = 'processing';
        if (daysSinceOrder >= 6) {
            currentStatus = 'delivered';
        } else if (daysSinceOrder >= 4) {
            currentStatus = 'out_for_delivery';
        } else if (daysSinceOrder >= 2) {
            currentStatus = 'shipped';
        }

        const progressMap = {
            'processing': { progress: 25, text: 'Order Confirmed', status: 'processing' },
            'shipped': { progress: 50, text: 'Shipped', status: 'shipped' },
            'out_for_delivery': { progress: 75, text: 'Out for Delivery', status: 'out_for_delivery' },
            'delivered': { progress: 100, text: 'Delivered', status: 'delivered' }
        };

        return progressMap[currentStatus] || { progress: 0, text: 'Processing', status: 'processing' };
    };

    // Delivery status with animation
    const DeliveryStatus = () => {
        const { progress, text, status } = getDeliveryProgress();
        const daysSinceOrder = Math.floor((Date.now() - new Date(orderData.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 6 - daysSinceOrder);

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200"
            >
                <h3 className="text-lg font-bold text-blue-900 mb-4">📦 Delivery Status</h3>

                {/* Progress Bar */}
                <div className="relative mb-4">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        />
                    </div>
                    <motion.div
                        initial={{ x: '-50%', opacity: 0 }}
                        animate={{ x: '-50%', opacity: 1 }}
                        className="absolute top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold"
                    >
                        {progress}% Complete
                    </motion.div>
                </div>

                {/* Status Steps */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {['processing', 'shipped', 'out_for_delivery', 'delivered'].map((stepStatus, idx) => {
                        const isActive = ['processing', 'shipped', 'out_for_delivery', 'delivered'].indexOf(status) >= idx;
                        return (
                            <div key={stepStatus} className="text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: isActive ? 1 : 0.8 }}
                                    className={`w-3 h-3 rounded-full mx-auto mb-2 ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                                />
                                <p className={`text-xs ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                                    {stepStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <p className="text-center text-blue-800 font-medium">{text}</p>
                <p className="text-center text-sm text-blue-600 mt-1">
                    {progress < 100 ? `Estimated delivery in ${daysRemaining} days` : 'Delivered successfully!'}
                </p>
            </motion.div>
        );
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto border-2 border-indigo-100">
            <div className="text-center mb-8">
                <Package className="mx-auto mb-3 text-indigo-600" size={40} />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h2>
                <p className="text-gray-600">Search by Order ID to see payment & delivery status</p>
            </div>

            <form onSubmit={handleLookup} className="mb-8">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                            placeholder="Enter Order ID (e.g., ELITE-12345)"
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-mono"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Search size={20} />
                        {loading ? <RefreshCw size={20} className="animate-spin" /> : 'Search'}
                    </button>
                </div>
            </form>

            <AnimatePresence>
                {orderData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        {/* Status Header */}
                        <div className={`p-6 rounded-2xl border-2 ${orderData.paymentStatus === 'verified' || orderData.paymentStatus === 'paid'
                            ? 'bg-green-50 border-green-200'
                            : orderData.paymentStatus === 'failed'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-yellow-50 border-yellow-200'
                            }`}>
                            <div className="flex items-center gap-4">
                                {getStatusIcon(orderData.status, orderData.paymentStatus)}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Order #{orderData.orderId}</h3>
                                    <p className="font-semibold">
                                        {orderData.paymentStatus === 'verified' || orderData.paymentStatus === 'paid'
                                            ? '✅ Payment Verified'
                                            : orderData.paymentStatus === 'failed'
                                                ? '❌ Payment Failed'
                                                : '⏳ Verification Pending'}
                                    </p>
                                    {pollingInterval && (
                                        <p className="text-sm text-indigo-600 flex items-center gap-1 mt-1">
                                            <RefreshCw size={14} className="animate-spin" />
                                            Auto-updating every 5 seconds...
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin size={20} className="text-indigo-600" />
                                Customer & Delivery Details
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Name:</p>
                                    <p className="font-semibold">{orderData.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Phone:</p>
                                    <p className="font-semibold">{orderData.phone}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-gray-600">Delivery Address:</p>
                                    <p className="font-semibold">{orderData.address ?
                                        (typeof orderData.address === 'object'
                                            ? `${orderData.address.street}, ${orderData.address.city}, ${orderData.address.state} - ${orderData.address.pincode}`
                                            : orderData.address)
                                        : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                            <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                                <CreditCard size={20} className="text-green-600" />
                                Payment Details
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Prepaid Amount (Paid):</span>
                                    <span className="font-bold text-green-600">₹100.00 ✅</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Balance (COD):</span>
                                    <span className="font-bold text-orange-600">₹1099.00</span>
                                </div>
                                <div className="border-t border-green-300 pt-3">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-gray-900">Total Order Value:</span>
                                        <span className="font-bold text-xl text-green-700">₹1199.00</span>
                                    </div>
                                </div>
                                <p className="text-xs text-green-700 mt-2">
                                    💡 Pay ₹1099 cash to delivery partner when your order arrives
                                </p>
                            </div>
                        </div>

                        {/* Delivery Status */}
                        <DeliveryStatus />

                        {/* Action Button */}
                        {(orderData.paymentStatus === 'verified' || orderData.paymentStatus === 'paid') && (
                            <button
                                onClick={handleDownloadInvoice}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Download size={20} />
                                Download Official Invoice
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {!orderData && !loading && (
                <div className="text-center text-gray-500 mt-8 p-6 bg-gray-50 rounded-xl">
                    <p className="mb-2">No order found yet</p>
                    <p className="text-sm">Enter your Order ID to check status</p>
                    <p className="text-xs mt-2">
                        Need help? <a href="https://www.instagram.com/elitemarts_" className="text-indigo-600 hover:underline">DM us on Instagram</a>
                    </p>
                </div>
            )}
        </div>
    );
}
