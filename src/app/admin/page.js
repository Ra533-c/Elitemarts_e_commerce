'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminPanel() {
    const [orders, setOrders] = useState([]);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Custom fetch to get orders (we need an API for this too! GET /api/orders?status=pending)
    // Wait, I didn't verify if I created a GET route.
    // The user prompt had "app/api/orders/pending" in the snippet.
    // I should ensure I have a route to fetch orders.
    // I currently only have POST /api/order.
    // I will add GET handler to /api/order/route.js or create /api/admin/orders.

    const fetchPendingOrders = async () => {
        if (!password) {
            toast.error('Enter password');
            return;
        }
        setLoading(true);
        try {
            // We'll use the same /api/verify route with a GET method or similar, 
            // OR add a GET to /api/order but protected.
            // Let's assume I will add GET to /api/admin/orders route.
            const res = await fetch(`/api/admin/orders?password=${password}`);
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setOrders(data.orders || []);
            if (data.orders?.length === 0) toast('No pending orders');
        } catch (e) {
            toast.error('Failed to fetch (check password)');
        } finally {
            setLoading(false);
        }
    };

    const verifyPayment = async (orderId) => {
        try {
            const res = await fetch("/api/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, password })
            });
            if (res.ok) {
                toast.success('Verified!');
                // Update local state
                setOrders(orders.filter(o => o.orderId !== orderId));
            } else {
                toast.error('Failed');
            }
        } catch (e) {
            toast.error('Error verifying');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Payment Verification</h1>

                <div className="bg-white p-6 rounded-xl shadow-md mb-8 flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
                        <input
                            type="password"
                            placeholder="Enter password (default: admin123)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button
                        onClick={fetchPendingOrders}
                        disabled={loading}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Load Pending Requests'}
                    </button>
                </div>

                {orders.length > 0 ? (
                    <div className="grid gap-4">
                        {orders.map(order => (
                            <div key={order.orderId} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-lg text-gray-800">{order.orderId}</span>
                                        <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Pending</span>
                                    </div>
                                    <p className="text-gray-600"><strong>Customer:</strong> {order.customerName} ({order.phone})</p>
                                    <p className="text-gray-500 text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                                </div>

                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-800">Paid: ₹{order.pricing?.prepaidAmount}</p>
                                    <p className="text-sm text-gray-500">Due: ₹{order.pricing?.balanceDue}</p>
                                </div>

                                <button
                                    onClick={() => verifyPayment(order.orderId)}
                                    className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600 transition shadow-lg shadow-green-200"
                                >
                                    ✅ Verify
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 mt-12">
                        <p>No pending orders found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
