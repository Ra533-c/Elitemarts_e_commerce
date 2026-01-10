'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import PaymentGateway from './PaymentGateway';
import PricingCard from './PricingCard';
import CelebrationAnimation from './CelebrationAnimation';
import { User, Phone, MapPin, Loader2, Sparkles, ArrowRight } from 'lucide-react';

const orderSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^[6-9]\\d{9}$/, 'Invalid Indian mobile number'),
    address: z.string().min(10, 'Address is too short (min 10 chars)'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^\\d{6}$/, 'Invalid 6-digit PIN code'),
});

export default function OrderForm() {
    // States
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [customerData, setCustomerData] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [showEncouragement, setShowEncouragement] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [pricing] = useState({
        finalPrice: 1199,
        couponApplied: true,
        balanceDue: 599
    });

    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        resolver: zodResolver(orderSchema)
    });

    const onSubmit = async (data) => {
        try {
            setFormSubmitted(true);
            setCustomerData(data);

            // Create payment session (NOT order yet!)
            const response = await fetch('/api/payment/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: data,
                    pricing
                })
            });

            const result = await response.json();

            if (result.success) {
                setSessionId(result.sessionId);
                setQrCodeData(result.qrCode);

                // Show encouragement message first
                setShowEncouragement(true);

                // After 2 seconds, show payment gateway
                setTimeout(() => {
                    setShowEncouragement(false);
                    setShowPayment(true);
                }, 2500);
            } else {
                toast.error(result.error || 'Failed to create payment session');
                setFormSubmitted(false);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            toast.error('Something went wrong. Please try again.');
            setFormSubmitted(false);
        }
    };

    const handlePaymentVerified = async (verifiedSessionId) => {
        try {
            // Create order after payment verification
            const response = await fetch('/api/payment/verify-and-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: verifiedSessionId })
            });

            const result = await response.json();

            if (result.success) {
                setOrderId(result.orderId);
                setShowPayment(false);
                setShowCelebration(true);

                // Save to localStorage
                localStorage.setItem('elitemarts_lastOrderId', result.orderId);
            } else {
                toast.error(result.error || 'Failed to create order');
            }
        } catch (error) {
            console.error('Order creation error:', error);
            toast.error('Failed to create order');
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
                {/* Address Form */}
                {!formSubmitted && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-3xl shadow-2xl p-8"
                    >
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                            📦 Delivery Details
                        </h2>

                        <PricingCard pricing={pricing} />

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <User className="inline mr-2" size={16} />
                                    Full Name
                                </label>
                                <input
                                    {...register('name')}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="Enter your full name"
                                />
                                {errors.name && (
                                    <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Phone className="inline mr-2" size={16} />
                                    Phone Number
                                </label>
                                <input
                                    {...register('phone')}
                                    type="tel"
                                    maxLength={10}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="10-digit mobile number"
                                />
                                {errors.phone && (
                                    <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                                )}
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <MapPin className="inline mr-2" size={16} />
                                    Complete Address
                                </label>
                                <textarea
                                    {...register('address')}
                                    rows={3}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all resize-none"
                                    placeholder="House/Flat No., Street, Landmark"
                                />
                                {errors.address && (
                                    <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
                                )}
                            </div>

                            {/* City, State, Pincode */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                    <input
                                        {...register('city')}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="City"
                                    />
                                    {errors.city && (
                                        <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                                    <input
                                        {...register('state')}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="State"
                                    />
                                    {errors.state && (
                                        <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                                    <input
                                        {...register('pincode')}
                                        type="text"
                                        maxLength={6}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="6-digit PIN"
                                    />
                                    {errors.pincode && (
                                        <p className="text-red-600 text-sm mt-1">{errors.pincode.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                Proceed to Payment
                                <ArrowRight size={20} />
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Encouragement Message */}
                {showEncouragement && (
                    <motion.div
                        key="encouragement"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-2xl p-12 text-center"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                        >
                            <Sparkles className="mx-auto mb-6 text-green-600" size={64} />
                        </motion.div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4">
                            ✨ Just One Step Away!
                        </h2>
                        <p className="text-xl text-gray-700 mb-2">
                            You're about to order your <span className="font-bold text-green-600">Robotic Massager</span>
                        </p>
                        <p className="text-lg text-gray-600">
                            💳 Make the ₹600 payment now to confirm your order
                        </p>
                    </motion.div>
                )}

                {/* Payment Gateway */}
                {showPayment && sessionId && (
                    <motion.div
                        key="payment"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <PaymentGateway
                            sessionId={sessionId}
                            qrCodeData={qrCodeData}
                            customerData={customerData}
                            pricing={pricing}
                            onPaymentVerified={handlePaymentVerified}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Celebration Animation */}
            {showCelebration && orderId && (
                <CelebrationAnimation
                    orderId={orderId}
                    orderData={{
                        orderId,
                        customerName: customerData?.name,
                        phone: customerData?.phone,
                        pricing
                    }}
                    onClose={() => {
                        setShowCelebration(false);
                        // Reset form
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
