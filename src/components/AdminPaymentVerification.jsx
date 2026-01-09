'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPaymentVerification() {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchId, setSearchId] = useState('');
    const [processingOrderId, setProcessingOrderId] = useState(null);

    const fetchPendingOrders = async () => {
        try {
            const response = await fetch('/api/order/verify-payment');
            const data = await response.json();

            if (data.success) {
                setPendingOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Failed to fetch pending orders:', error);
            toast.error('Failed to load pending payments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingOrders();
        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchPendingOrders, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleVerifyPayment = async (orderId) => {
        setProcessingOrderId(orderId);
        try {
            const response = await fetch('/api/order/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    action: 'verify',
                    adminName: 'Admin' // You can replace with actual admin name
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Payment verified for order ${orderId}! ✅`);
                // Refresh the list
                fetchPendingOrders();
            } else {
                toast.error('Failed to verify payment');
            }
        } catch (error) {
            console.error('Verification failed:', error);
            toast.error('Failed to verify payment');
        } finally {
            setProcessingOrderId(null);
        }
    };

    const handleRejectPayment = async (orderId) => {
        setProcessingOrderId(orderId);
        try {
            const response = await fetch('/api/order/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    action: 'reject',
                    adminName: 'Admin'
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Payment rejected for order ${orderId}`);
                // Refresh the list
                fetchPendingOrders();
            } else {
                toast.error('Failed to reject payment');
            }
        } catch (error) {
            console.error('Rejection failed:', error);
            toast.error('Failed to reject payment');
        } finally {
            setProcessingOrderId(null);
        }
    };

    const filteredOrders = pendingOrders.filter(order =>
        !searchId || order.orderId.toLowerCase().includes(searchId.toLowerCase())
    );

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-6xl mx-auto my-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="text-indigo-600" size={28} />
                    Payment Verification
                </h2>
                <button
                    onClick={fetchPendingOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by Order ID..."
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <Loader2 className="animate-spin mx-auto mb-3 text-indigo-600" size={48} />
                    <p className="text-gray-600">Loading pending payments...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <CheckCircle className="mx-auto mb-3 text-green-600" size={48} />
                    <p className="text-gray-600 font-semibold">No pending payments to verify!</p>
                    <p className="text-sm text-gray-500 mt-1">All caught up 🎉</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div
                            key={order._id}
                            className="border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-all"
                        >
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 font-semibold mb-1">Order ID</p>
                                    <p className="font-mono font-bold text-lg text-indigo-700">{order.orderId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 font-semibold mb-1">Customer</p>
                                    <p className="font-semibold text-gray-900">{order.customer?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">{order.customer?.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 font-semibold mb-1">Amount</p>
                                    <p className="text-2xl font-bold text-green-600">₹600</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 font-semibold mb-1">Created</p>
                                    <p className="text-gray-700">
                                        {new Date(order.createdAt).toLocaleString('en-IN', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => handleVerifyPayment(order.orderId)}
                                    disabled={processingOrderId === order.orderId}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition-all font-bold disabled:opacity-50"
                                >
                                    {processingOrderId === order.orderId ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            Verify Payment
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleRejectPayment(order.orderId)}
                                    disabled={processingOrderId === order.orderId}
                                    className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:from-red-700 hover:to-rose-700 transition-all font-bold disabled:opacity-50"
                                >
                                    {processingOrderId === order.orderId ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={20} />
                                            Reject Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                    <Clock className="text-blue-600 shrink-0" size={24} />
                    <div className="text-sm text-blue-900">
                        <p className="font-bold mb-1">Instructions:</p>
                        <ul className="space-y-1 text-blue-800">
                            <li>• Check your UPI account for ₹600 payments</li>
                            <li>• Match Order ID with payment transaction note</li>
                            <li>• Click "Verify" if payment received correctly</li>
                            <li>• Click "Reject" if payment not found or incorrect amount</li>
                            <li>• Customer gets instant notification of verification status</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
