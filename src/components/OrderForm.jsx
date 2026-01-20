'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import PricingCard from './PricingCard';
import { User, Phone, MapPin, Loader2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { createPaymentSession } from '@/lib/usePaymentSession';

const orderSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone number must be 10 digits').max(10, 'Phone number must be 10 digits'),
    address: z.string().min(10, 'Address is too short (min 10 chars)'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(6, 'Pincode must be 6 digits').max(6, 'Pincode must be 6 digits'),
});

export default function OrderForm() {
    const router = useRouter();

    // States
    const [loadingPincode, setLoadingPincode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [pricing] = useState({
        finalPrice: 1199,
        couponApplied: true,
        balanceDue: 599
    });

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(orderSchema)
    });

    const pincode = watch('pincode');

    // Auto-fill from localStorage if payment was rejected
    useEffect(() => {
        console.log('Checking for rejected customer data...');
        const savedData = localStorage.getItem('elitemarts_rejected_customer');
        console.log('Saved data from localStorage:', savedData);

        if (savedData) {
            try {
                setIsAutoFilling(true); // Prevent pincode lookup during auto-fill
                const data = JSON.parse(savedData);
                console.log('Parsed customer data:', data);

                setValue('name', data.name);
                setValue('phone', data.phone);
                setValue('address', data.address);
                setValue('city', data.city);
                setValue('state', data.state);
                setValue('pincode', data.pincode);

                console.log('Form auto-filled successfully!');

                toast.success('✨ Form auto-filled! Click "Proceed to Payment" to retry.', {
                    duration: 5000,
                    icon: '🔄'
                });

                // Clear after auto-fill
                localStorage.removeItem('elitemarts_rejected_customer');
                console.log('Cleared rejected customer data from localStorage');

                // Re-enable pincode lookup after a short delay
                setTimeout(() => {
                    setIsAutoFilling(false);
                }, 500);
            } catch (e) {
                console.error('Error loading saved data:', e);
                setIsAutoFilling(false);
            }
        } else {
            console.log('No rejected customer data found');
        }
    }, [setValue]);

    // Auto-fill city and state based on pincode
    useEffect(() => {
        // Skip if auto-filling from rejected payment
        if (isAutoFilling) return;

        if (pincode && pincode.length === 6) {
            setLoadingPincode(true);
            fetch(`https://api.postalpincode.in/pincode/${pincode}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data[0] && data[0].Status === 'Success') {
                        const postOffice = data[0].PostOffice[0];
                        setValue('city', postOffice.District);
                        setValue('state', postOffice.State);
                        toast.success('City and State auto-filled!');
                    } else {
                        toast.error('Invalid pincode');
                    }
                })
                .catch(err => {
                    console.error('Pincode lookup error:', err);
                })
                .finally(() => {
                    setLoadingPincode(false);
                });
        }
    }, [pincode, setValue, isAutoFilling]);

    const onSubmit = async (data) => {
        try {
            setIsSubmitting(true);

            // Save customer data to localStorage (in case of rejection)
            localStorage.setItem('elitemarts_last_customer', JSON.stringify(data));

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
                // Store session in localStorage with 12h expiry
                createPaymentSession(result.sessionId, data, pricing);

                toast.success('Payment session created! Redirecting...', { duration: 1500 });

                // Redirect to payment waiting page
                setTimeout(() => {
                    router.push('/payment-waiting');
                }, 500);
            } else {
                toast.error(result.error || 'Failed to create payment session');
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            toast.error('Something went wrong. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
                {/* Address Form */}
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
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Creating Payment Session...
                                </>
                            ) : (
                                <>
                                    Proceed to Payment
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                {/* Loading Overlay - During Payment Session Creation */}
                {isSubmitting && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 text-center"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="mx-auto mb-6"
                            >
                                <Loader2 className="w-16 h-16 text-indigo-600" />
                            </motion.div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                Creating Payment Session...
                            </h3>

                            <p className="text-gray-600 mb-4">
                                Please wait while we prepare your payment gateway
                            </p>

                            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                                <p className="text-sm font-semibold text-yellow-800 flex items-center justify-center gap-2">
                                    <AlertCircle size={18} />
                                    Do not close or refresh this page
                                </p>
                            </div>

                            <div className="mt-4 flex items-center justify-center gap-2">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="w-2 h-2 bg-indigo-600 rounded-full"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                    className="w-2 h-2 bg-indigo-600 rounded-full"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                    className="w-2 h-2 bg-indigo-600 rounded-full"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

