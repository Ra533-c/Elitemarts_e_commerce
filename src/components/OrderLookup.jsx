'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderLookup() {
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState(null);

    const handleLookup = async (e) => {
        e.preventDefault();

        if (!orderId.trim()) {
            toast.error('Please enter an Order ID');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/order/status?orderId=${orderId.trim()}`);
            const data = await response.json();

            if (response.ok && data.order) {
                setOrderData(data.order);
                toast.success('Order found!');
            } else {
                toast.error('Order not found. Please check your Order ID.');
                setOrderData(null);
            }
        } catch (error) {
            toast.error('Failed to fetch order status');
            setOrderData(null);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid':
                return <CheckCircle className="text-green-500" size={28} />;
            case 'pending':
                return <Clock className="text-yellow-500" size={28} />;
            default:
                return <XCircle className="text-gray-400" size={28} />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'paid':
                return { text: 'Payment Verified ✓', color: 'text-green-600', bg: 'bg-green-50' };
            case 'pending':
                return { text: 'Payment Pending ⏳', color: 'text-yellow-600', bg: 'bg-yellow-50' };
            default:
                return { text: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-50' };
        }
    };

    return (
        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border-2 border-indigo-100 max-w-2xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
                <Package className="mx-auto mb-4 text-indigo-600" size={40} />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Check Order Status</h2>
                <p className="text-gray-600 text-sm sm:text-base px-4">Enter your Order ID to check payment status</p>
            </div>

            <form onSubmit={handleLookup} className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                        placeholder="ELITE-XXXXXX"
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-base sm:text-lg font-mono"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 text-base sm:text-lg"
                    >
                        <Search size={20} />
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {orderData && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 sm:p-6 rounded-2xl border-2 ${orderData.status === 'paid' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                        }`}
                >
                    <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                        {getStatusIcon(orderData.status)}
                        <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                                Order #{orderData.orderId}
                            </h3>
                            <p className={`font-semibold text-sm sm:text-base ${getStatusText(orderData.status).color}`}>
                                {getStatusText(orderData.status).text}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Customer:</span>
                            <span className="font-semibold text-gray-900">{orderData.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-semibold text-gray-900">{orderData.phone}</span>
                        </div>

                        <div className="h-px bg-gray-300 my-3"></div>

                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-semibold text-gray-900">₹{orderData.pricing?.finalPrice}</span>
                        </div>

                        {orderData.status === 'paid' ? (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Paid (Verified):</span>
                                    <span className="font-semibold text-green-600">₹{orderData.pricing?.prepaidAmount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Balance Due (COD):</span>
                                    <span className="font-semibold text-orange-600">₹{orderData.pricing?.balanceDue}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Booking Fee Required:</span>
                                    <span className="font-semibold text-orange-600">₹{orderData.pricing?.prepaidAmount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Balance on Delivery:</span>
                                    <span className="font-semibold text-gray-600">₹{orderData.pricing?.balanceDue}</span>
                                </div>
                                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mt-3">
                                    <p className="text-xs text-yellow-800 font-semibold">
                                        ⚠️ Payment Status: NOT PAID YET
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Please complete the ₹{orderData.pricing?.prepaidAmount} booking fee payment to confirm your order.
                                    </p>
                                </div>
                            </>
                        )}

                        <div className="flex justify-between mt-3">
                            <span className="text-gray-600">Order Date:</span>
                            <span className="font-semibold text-gray-900">
                                {new Date(orderData.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {orderData.status === 'pending' && (
                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-100 rounded-xl border-2 border-yellow-300">
                            <p className="text-xs sm:text-sm text-yellow-800">
                                <strong>⏳ Awaiting Payment:</strong> Your payment is being verified. This usually takes up to 24 hours after you pay.
                                If you haven't paid yet, please complete the payment using the UPI details provided.
                            </p>
                        </div>
                    )}

                    {orderData.status === 'paid' && (
                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-100 rounded-xl border-2 border-green-300">
                            <p className="text-xs sm:text-sm text-green-800">
                                <strong>✅ Payment Confirmed!</strong> Your payment has been verified. Your order will be shipped within 4-6 business days.
                                Pay the remaining ₹{orderData.pricing?.balanceDue} on delivery.
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
