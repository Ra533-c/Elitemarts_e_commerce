'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import confetti from 'canvas-confetti';
import PaymentGateway from './PaymentGateway';
import PricingCard from './PricingCard';
import { User, Phone, MapPin, Package, Loader2, CheckCircle, Sparkles } from 'lucide-react';

const orderSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
    address: z.string().min(10, 'Address is too short (min 10 chars)'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid 6-digit PIN code'),
});

export default function OrderForm() {
    const [step, setStep] = useState(1);
    const [orderData, setOrderData] = useState(null);
    const [pricing, setPricing] = useState({
        finalPrice: 1199,
        couponApplied: true,
        balanceDue: 599
    });
    const [loadingPincode, setLoadingPincode] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [paymentCompleted, setPaymentCompleted] = useState(false);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(orderSchema)
    });

    // Check for saved order data and payment status on component mount
    useEffect(() => {
        // Load saved order data
        const savedOrderData = localStorage.getItem('elitemarts_orderData');
        const savedPricing = localStorage.getItem('elitemarts_pricing');
        const savedStep = localStorage.getItem('elitemarts_step');

        if (savedOrderData) {
            setOrderData(JSON.parse(savedOrderData));
        }

        if (savedPricing) {
            setPricing(JSON.parse(savedPricing));
        }

        if (savedStep) {
            setStep(parseInt(savedStep));
        }

        // Check payment status for saved order
        if (savedOrderData) {
            const orderDataParsed = JSON.parse(savedOrderData);
            if (orderDataParsed.orderId) {
                const savedPaymentStatus = localStorage.getItem(`payment_${orderDataParsed.orderId}`);
                if (savedPaymentStatus === 'completed') {
                    setPaymentCompleted(true);
                }
            }
        }
    }, []);

    // Save order data to localStorage whenever it changes
    useEffect(() => {
        if (orderData) {
            localStorage.setItem('elitemarts_orderData', JSON.stringify(orderData));
        }
    }, [orderData]);

    useEffect(() => {
        localStorage.setItem('elitemarts_pricing', JSON.stringify(pricing));
    }, [pricing]);

    useEffect(() => {
        localStorage.setItem('elitemarts_step', step.toString());
    }, [step]);

    const handlePaymentComplete = async (orderId) => {
        try {
            // Update payment status in database
            const response = await fetch('/api/order/status', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    status: 'paid'
                }),
            });

            if (response.ok) {
                setPaymentCompleted(true);
                // Save payment status to localStorage
                localStorage.setItem(`payment_${orderId}`, 'completed');
                // Move to final step
                setStep(4);
                toast.success('Payment confirmed! You can now download your invoice.');
            } else {
                console.error('Failed to update payment status');
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    };
    const handlePincodeChange = async (e) => {
        const pin = e.target.value;
        setValue('pincode', pin);

        if (pin.length === 6) {
            setLoadingPincode(true);
            try {
                const response = await axios.get(`https://api.postalpincode.in/pincode/${pin}`);

                if (response.data && response.data[0]?.Status === 'Success') {
                    const postOffice = response.data[0].PostOffice[0];
                    setValue('city', postOffice.District);
                    setValue('state', postOffice.State);
                    toast.success('City and State auto-filled!');
                } else {
                    toast.error('Invalid pincode or not found');
                }
            } catch (error) {
                console.error('Pincode lookup failed:', error);
                toast.error('Could not fetch location details');
            } finally {
                setLoadingPincode(false);
            }
        }
    };

    const onDetailsSubmit = async (data) => {
        console.log('Form data:', data);
        console.log('Pricing:', pricing);

        try {
            const response = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: data,
                    pricing,
                    couponApplied: pricing.couponApplied
                })
            });

            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response data:', result);

            if (response.ok) {
                setOrderData({ ...data, orderId: result.orderId });

                // Success celebration
                setShowSuccess(true);
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b']
                });

                setTimeout(() => {
                    setShowSuccess(false);
                    setStep(2);
                }, 2000);

                toast.success('Order created successfully!');
            } else {
                console.error('Order creation failed:', result);
                toast.error(result.error || 'Failed to create order. Please try again.');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Network error. Please check your connection.');
        }
    };

    return (
        <div id="order-form" className="max-w-3xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 md:p-10 my-8 sm:my-12 border-2 border-indigo-100 relative overflow-hidden">

            {/* Success Animation Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 z-50 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="text-center"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="inline-block mb-4"
                            >
                                <Sparkles size={64} className="text-yellow-300" />
                            </motion.div>
                            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2">Order Created!</h3>
                            <p className="text-white/90 text-lg">Proceeding to payment...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Steps */}
            <div className="flex justify-between mb-8 sm:mb-12 max-w-md mx-auto relative">
                <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
                <div
                    className="absolute top-5 left-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 -z-10 rounded-full transition-all duration-500"
                    style={{ width: step === 1 ? '0%' : '100%' }}
                ></div>

                {['Details', paymentCompleted ? 'Payment Complete' : 'Payment'].map((label, idx) => (
                    <div key={label} className="flex flex-col items-center bg-white px-2">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all text-sm sm:text-base ${step > idx + 1 || (idx + 1 === 2 && paymentCompleted) ? 'bg-green-500 text-white shadow-lg' :
                            step === idx + 1 ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white ring-4 ring-indigo-100 shadow-lg' :
                                'bg-gray-200 text-gray-500'
                            }`}>
                            {step > idx + 1 ? <span className="text-xl sm:text-2xl">✓</span> : idx + 1}
                        </div>
                        <span className={`text-xs sm:text-sm font-bold mt-2 ${step === idx + 1 ? 'text-indigo-700' : 'text-gray-400'}`}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <div className="mb-8 sm:mb-10">
                            <PricingCard onPriceChange={setPricing} />
                        </div>

                        <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-5 sm:space-y-6">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-3">
                                <Package className="text-indigo-600" size={28} />
                                Shipping Details
                            </h2>

                            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <User size={16} /> Full Name
                                    </label>
                                    <input
                                        {...register('name')}
                                        placeholder="John Doe"
                                        className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-base"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">{errors.name.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <Phone size={16} /> Mobile Number
                                    </label>
                                    <input
                                        {...register('phone')}
                                        placeholder="9876543210"
                                        className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-base"
                                        type="tel"
                                        maxLength={10}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">{errors.phone.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">PIN Code</label>
                                <div className="relative">
                                    <input
                                        {...register('pincode')}
                                        onChange={handlePincodeChange}
                                        placeholder="400001"
                                        maxLength={6}
                                        className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-base pr-12"
                                    />
                                    {loadingPincode && (
                                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-600" size={20} />
                                    )}
                                </div>
                                {errors.pincode && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.pincode.message}</p>}
                                <p className="text-xs text-gray-500 mt-1">City and State will be auto-filled</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 sm:gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                                    <input {...register('city')} placeholder="Mumbai" className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-base bg-gray-50" readOnly />
                                    {errors.city && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.city.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                                    <input {...register('state')} placeholder="Maharashtra" className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-base bg-gray-50" readOnly />
                                    {errors.state && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.state.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <MapPin size={16} /> Complete Address
                                </label>
                                <textarea
                                    {...register('address')}
                                    placeholder="House No, Street, Landmark"
                                    rows="3"
                                    className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all resize-none text-base"
                                />
                                {errors.address && <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">{errors.address.message}</p>}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all mt-6"
                            >
                                Proceed to Payment →
                            </button>
                        </form>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <button
                            onClick={() => setStep(1)}
                            className="text-sm text-indigo-600 mb-6 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                        >
                            ← Back to Details
                        </button>
                        <PaymentGateway
                            orderId={orderData?.orderId || "TEST"}
                            amount={600}
                            orderData={orderData}
                            pricing={pricing}
                            onPaymentComplete={handlePaymentComplete}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
