'use client';

import { useState, useEffect } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, CreditCard, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrderTrackingPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const searchOrder = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setError('Please enter an Order ID or Phone Number');
            return;
        }

        setLoading(true);
        setError('');
        setOrderData(null);

        try {
            // Determine if it's an order ID or phone number
            const isOrderId = searchQuery.startsWith('ELITE-');
            const queryParam = isOrderId ? `orderId=${searchQuery}` : `phone=${searchQuery}`;

            const response = await fetch(`/api/order/track?${queryParam}`);
            const data = await response.json();

            if (data.success) {
                setOrderData(data.order);
            } else {
                setError(data.message || 'Order not found');
            }
        } catch (err) {
            setError('Failed to fetch order details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh order data every 30 seconds
    useEffect(() => {
        if (!orderData) return;

        const refreshInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/order/track?orderId=${orderData.orderId}`);
                const data = await response.json();
                if (data.success) {
                    setOrderData(data.order);
                }
            } catch (err) {
                console.error('Auto-refresh failed:', err);
            }
        }, 30000); // 30 seconds

        return () => clearInterval(refreshInterval);
    }, [orderData]);

    const getDeliveryStages = () => {
        const stages = [
            { id: 'processing', label: 'Processing', icon: Clock },
            { id: 'shipped', label: 'Shipped', icon: Package },
            { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
            { id: 'delivered', label: 'Delivered', icon: CheckCircle }
        ];

        const currentIndex = stages.findIndex(s => s.id === orderData?.deliveryStatus);
        return stages.map((stage, index) => ({
            ...stage,
            isActive: index <= currentIndex,
            isCurrent: index === currentIndex
        }));
    };

    const calculateProgress = () => {
        const stages = ['processing', 'shipped', 'out_for_delivery', 'delivered'];
        const currentIndex = stages.indexOf(orderData?.deliveryStatus || 'processing');
        return ((currentIndex + 1) / stages.length) * 100;
    };

    const getDaysElapsed = () => {
        if (!orderData?.createdAt) return 0;
        const created = new Date(orderData.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.min(diffDays, 6);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Track Your Order</h1>
                    <p className="text-gray-600">Enter your Order ID or Phone Number to track your delivery</p>
                </div>

                {/* Search Form */}
                <form onSubmit={searchOrder} className="mb-8">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter Order ID (ELITE-XXX) or Phone Number"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium"
                        >
                            {loading ? 'Searching...' : 'Track'}
                        </button>
                    </div>
                </form>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Order Details */}
                <AnimatePresence>
                    {orderData && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
                        >
                            {/* Order Header */}
                            <div className="border-b pb-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Order Details</h2>
                                        <p className="text-gray-600">Order ID: <span className="font-mono font-semibold">{orderData.orderId}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Order Date</p>
                                        <p className="font-semibold">{new Date(orderData.createdAt).toLocaleDateString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Status Section */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-green-600" />
                                    Payment Status
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Prepaid Amount */}
                                    <div className="bg-white rounded-lg p-4 border-2 border-green-500">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-600">Prepaid Amount</span>
                                            <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                                                PAID ✓
                                            </span>
                                        </div>
                                        <p className="text-3xl font-bold text-green-600">₹600</p>
                                        <p className="text-xs text-gray-500 mt-1">Payment Method: {orderData.paymentMethod || 'UPI/Online'}</p>
                                    </div>

                                    {/* COD Balance */}
                                    <div className="bg-white rounded-lg p-4 border-2 border-orange-400">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-600">Balance (COD)</span>
                                            <span className="px-3 py-1 bg-orange-400 text-white text-xs font-bold rounded-full">
                                                {orderData.deliveryStatus === 'delivered' ? 'PAID ✓' : 'PENDING'}
                                            </span>
                                        </div>
                                        <p className="text-3xl font-bold text-orange-600">₹{orderData.pricing?.balanceDue || 599}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {orderData.deliveryStatus === 'delivered' ? 'Paid on delivery' : 'Pay on delivery'}
                                        </p>
                                    </div>
                                </div>

                                {/* Total Amount */}
                                <div className="mt-4 pt-4 border-t border-green-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold text-gray-700">Total Order Value:</span>
                                        <span className="text-2xl font-bold text-gray-900">₹{orderData.pricing?.finalPrice || 1199}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Status with Animation */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Progress</h3>

                                {/* Animated Progress Bar */}
                                <div className="mb-6">
                                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${calculateProgress()}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded-full"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 text-center font-medium">
                                        {calculateProgress().toFixed(0)}% Complete • Day {getDaysElapsed()} of 4-6
                                    </p>
                                </div>

                                {/* Delivery Stages */}
                                <div className="grid grid-cols-4 gap-2">
                                    {getDeliveryStages().map((stage, index) => {
                                        const Icon = stage.icon;
                                        return (
                                            <motion.div
                                                key={stage.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="text-center"
                                            >
                                                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${stage.isActive
                                                        ? 'bg-purple-600 text-white scale-110'
                                                        : 'bg-gray-200 text-gray-400'
                                                    }`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <p className={`text-xs font-medium ${stage.isActive ? 'text-purple-600' : 'text-gray-400'
                                                    }`}>
                                                    {stage.label}
                                                </p>
                                                {stage.isCurrent && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="mt-1"
                                                    >
                                                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                                                            Current
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Estimated Delivery */}
                            {orderData.estimatedDelivery && (
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <p className="text-sm text-blue-900 font-medium mb-1">Estimated Delivery</p>
                                    <p className="text-2xl font-bold text-blue-700">{orderData.estimatedDelivery.days}</p>
                                    <p className="text-sm text-blue-600 mt-1">
                                        Expected: {new Date(orderData.estimatedDelivery.start).toLocaleDateString('en-IN')} - {new Date(orderData.estimatedDelivery.end).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                            )}

                            {/* Customer Details */}
                            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-gray-600">Name:</span> <span className="font-medium">{orderData.customerName}</span></p>
                                        <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{orderData.phone}</span></p>
                                        {orderData.email && (
                                            <p><span className="text-gray-600">Email:</span> <span className="font-medium">{orderData.email}</span></p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Delivery Address</h4>
                                    <p className="text-sm text-gray-700">
                                        {orderData.address.street}, {orderData.address.city}, {orderData.address.state} - {orderData.address.pincode}
                                    </p>
                                </div>
                            </div>

                            {/* Tracking History */}
                            {orderData.trackingHistory && orderData.trackingHistory.length > 0 && (
                                <div className="pt-6 border-t">
                                    <h4 className="font-semibold text-gray-900 mb-4">Tracking History</h4>
                                    <div className="space-y-3">
                                        {orderData.trackingHistory.map((event, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex gap-3"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{event.message}</p>
                                                    <p className="text-sm text-gray-600">{new Date(event.timestamp).toLocaleString('en-IN')}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Auto-refresh indicator */}
                            <div className="text-center text-xs text-gray-500 pt-4 border-t">
                                <p>🔄 Auto-refreshing every 30 seconds for real-time updates</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Help Section */}
                {!orderData && !loading && (
                    <div className="text-center mt-12 text-gray-600">
                        <p className="mb-2">Need help?</p>
                        <p className="text-sm">Contact us at <a href="tel:+918607832386" className="text-purple-600 hover:underline font-medium">+91 8607832386</a></p>
                    </div>
                )}
            </div>
        </div>
    );
}
