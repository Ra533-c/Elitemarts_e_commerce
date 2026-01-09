'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle, Clock, XCircle, RefreshCw, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateClientInvoice } from '@/lib/clientInvoice';

export default function OrderLookup() {
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [pollingInterval, setPollingInterval] = useState(null);

    // Auto-check effect
    useEffect(() => {
        return () => {
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, [pollingInterval]);

    const startPolling = (id) => {
        if (pollingInterval) clearInterval(pollingInterval);

        const interval = setInterval(() => {
            checkStatus(id, true);
        }, 10000); // 10 seconds

        setPollingInterval(interval);
    };

    const stopPolling = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
        }
    };

    const checkStatus = async (id, isAuto = false) => {
        try {
            const response = await fetch(`/api/order/status?orderId=${id}`);
            const data = await response.json();

            if (response.ok && data.order) {
                setOrderData(data.order);

                // If verified/paid, stop polling and show success toast (only once)
                if (data.order.paymentStatus === 'verified' || data.order.status === 'paid') {
                    if (isAuto) toast.success('Payment Verified! ✅');
                    stopPolling();
                }
            } else if (!isAuto) {
                toast.error('Order not found');
                setOrderData(null);
            }
        } catch (error) {
            console.error('Status check failed:', error);
            if (!isAuto) toast.error('Failed to check status');
        }
    };

    const handleLookup = async (e) => {
        e.preventDefault();

        if (!orderId.trim()) {
            toast.error('Please enter an Order ID');
            return;
        }

        setLoading(true);
        // Clear previous state
        stopPolling();
        setOrderData(null);

        await checkStatus(orderId.trim());

        // Start polling if order found and pending
        startPolling(orderId.trim());

        setLoading(false);
    };

    const handleDownloadInvoice = async () => {
        if (!orderData) return;

        try {
            await generateClientInvoice(orderData);
            toast.success('Invoice downloaded successfully!');
        } catch (error) {
            console.error('Invoice error:', error);
            toast.error('Failed to generate invoice');
        }
    };

    const getStatusIcon = (status, paymentStatus) => {
        if (paymentStatus === 'verified' || status === 'paid') {
            return <CheckCircle className="text-green-500" size={32} />;
        }
        if (paymentStatus === 'failed') {
            return <XCircle className="text-red-500" size={32} />;
        }
        return <Clock className="text-yellow-500" size={32} />;
    };

    return (
        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border-2 border-indigo-100 max-w-2xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
                <Package className="mx-auto mb-4 text-indigo-600" size={40} />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Check Order Status</h2>
                <p className="text-gray-600 text-sm sm:text-base px-4">Enter your Order ID to check real-time status</p>
            </div>

            <form onSubmit={handleLookup} className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                        placeholder="ELITE-XXXXXX"
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-base sm:text-lg font-mono uppercase"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 text-base sm:text-lg"
                    >
                        <Search size={20} />
                        {loading ? 'Searching...' : 'Check Status'}
                    </button>
                </div>
            </form>

            {orderData && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 sm:p-6 rounded-2xl border-2 ${orderData.paymentStatus === 'verified' || orderData.status === 'paid'
                            ? 'border-green-200 bg-green-50'
                            : orderData.paymentStatus === 'failed'
                                ? 'border-red-200 bg-red-50'
                                : 'border-yellow-200 bg-yellow-50'
                        }`}
                >
                    <div className="flex items-start gap-4 mb-6">
                        {getStatusIcon(orderData.status, orderData.paymentStatus)}
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                Order #{orderData.orderId}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`font-semibold ${orderData.paymentStatus === 'verified' || orderData.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                                    }`}>
                                    {orderData.paymentStatus === 'verified' || orderData.status === 'paid'
                                        ? 'Payment Verified ✅'
                                        : 'Verification Pending ⏳'}
                                </span>
                                {pollingInterval && (
                                    <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full animate-pulse">
                                        <RefreshCw size={12} className="animate-spin" />
                                        Updating...
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm border-t border-b border-gray-200 py-4 my-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Customer:</span>
                            <span className="font-semibold">{orderData.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-semibold">₹{orderData.pricing?.finalPrice}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-semibold">
                                {new Date(orderData.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {(orderData.paymentStatus === 'verified' || orderData.status === 'paid') ? (
                        <div className="mt-4">
                            <button
                                onClick={handleDownloadInvoice}
                                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Download size={20} />
                                Download Invoice
                            </button>
                            <p className="text-center text-xs text-green-700 mt-2">
                                ✅ Your order is confirmed and will be shipped soon.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 text-center">
                            <p className="text-sm text-yellow-800 font-medium mb-2">
                                We are verifying your payment...
                            </p>
                            <p className="text-xs text-gray-500">
                                This page refreshes automatically every 10 seconds.
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
