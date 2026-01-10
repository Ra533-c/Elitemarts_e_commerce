'use client';

import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock } from 'lucide-react';

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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'processing':
                return <Clock className="w-6 h-6 text-blue-500" />;
            case 'shipped':
                return <Package className="w-6 h-6 text-purple-500" />;
            case 'out_for_delivery':
                return <Truck className="w-6 h-6 text-orange-500" />;
            case 'delivered':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            default:
                return <Clock className="w-6 h-6 text-gray-500" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'processing':
                return 'Order is being processed';
            case 'shipped':
                return 'Order has been shipped';
            case 'out_for_delivery':
                return 'Out for delivery';
            case 'delivered':
                return 'Delivered successfully';
            default:
                return 'Unknown status';
        }
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
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Order Details */}
                {orderData && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                        {/* Order Header */}
                        <div className="border-b pb-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Order Details</h2>
                                    <p className="text-gray-600">Order ID: <span className="font-mono font-semibold">{orderData.orderId}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Order Date</p>
                                    <p className="font-semibold">{new Date(orderData.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Status */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Delivery Status</h3>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(orderData.deliveryStatus)}
                                    <span className="font-medium text-gray-700">{getStatusText(orderData.deliveryStatus)}</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative">
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-out"
                                        style={{ width: `${orderData.progressPercentage}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-600 mt-2 text-center">
                                    {orderData.progressPercentage}% Complete
                                </p>
                            </div>

                            {/* Status Steps */}
                            <div className="grid grid-cols-4 gap-2 mt-6">
                                {['processing', 'shipped', 'out_for_delivery', 'delivered'].map((status, index) => {
                                    const isActive = ['processing', 'shipped', 'out_for_delivery', 'delivered'].indexOf(orderData.deliveryStatus) >= index;
                                    return (
                                        <div key={status} className="text-center">
                                            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${isActive ? 'bg-purple-600' : 'bg-gray-300'}`} />
                                            <p className={`text-xs ${isActive ? 'text-purple-600 font-semibold' : 'text-gray-400'}`}>
                                                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Estimated Delivery */}
                        {orderData.estimatedDelivery && (
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-blue-900 font-medium mb-1">Estimated Delivery</p>
                                <p className="text-2xl font-bold text-blue-700">{orderData.estimatedDelivery.days}</p>
                                <p className="text-sm text-blue-600 mt-1">
                                    Expected: {new Date(orderData.estimatedDelivery.start).toLocaleDateString()} - {new Date(orderData.estimatedDelivery.end).toLocaleDateString()}
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
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Delivery Address</h4>
                                <p className="text-sm text-gray-700">
                                    {orderData.address.street}, {orderData.address.city}, {orderData.address.state} - {orderData.address.pincode}
                                </p>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-green-900 font-medium">Payment Status</p>
                                    <p className="text-lg font-bold text-green-700">Paid ✓</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-green-900">Amount Paid</p>
                                    <p className="text-2xl font-bold text-green-700">₹{orderData.pricing.prepaidAmount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tracking History */}
                        {orderData.trackingHistory && orderData.trackingHistory.length > 0 && (
                            <div className="pt-6 border-t">
                                <h4 className="font-semibold text-gray-900 mb-4">Tracking History</h4>
                                <div className="space-y-3">
                                    {orderData.trackingHistory.map((event, index) => (
                                        <div key={index} className="flex gap-3">
                                            <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{event.message}</p>
                                                <p className="text-sm text-gray-600">{new Date(event.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Help Section */}
                {!orderData && !loading && (
                    <div className="text-center mt-12 text-gray-600">
                        <p className="mb-2">Need help?</p>
                        <p className="text-sm">Contact us at <a href="tel:+918607832386" className="text-purple-600 hover:underline">+91 8607832386</a></p>
                    </div>
                )}
            </div>
        </div>
    );
}
