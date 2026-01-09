'use client';

import AdminPaymentVerification from '@/components/AdminPaymentVerification';

export default function AdminPanel() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Admin Panel
                    </h1>
                    <p className="text-gray-600">
                        Verify or reject pending UPI payments
                    </p>
                </div>

                <AdminPaymentVerification />
            </div>
        </div>
    );
}
