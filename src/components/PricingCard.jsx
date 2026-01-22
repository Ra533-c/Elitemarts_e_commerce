'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PricingCard({ onPriceChange }) {
    const [couponApplied, setCouponApplied] = useState(true);

    const originalPrice = 3999;
    const discountedPrice = 1199;
    const prepaidAmount = 100;

    const finalPrice = couponApplied ? discountedPrice : originalPrice;
    const balanceDue = finalPrice - prepaidAmount;

    useEffect(() => {
        if (onPriceChange) {
            onPriceChange({
                finalPrice,
                couponApplied,
                balanceDue
            });
        }
    }, [couponApplied, finalPrice, balanceDue, onPriceChange]);

    const handleCouponToggle = () => {
        const newState = !couponApplied;
        setCouponApplied(newState);

        // Celebration animation when coupon is applied
        if (newState) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#34d399', '#6ee7b7']
            });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border-2 border-indigo-100 max-w-md mx-auto"
        >
            <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Pricing</h3>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg">
                    <Sparkles size={14} /> 60% OFF
                </div>
            </div>

            {/* Coupon Toggle */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all mb-6 sm:mb-8 ${couponApplied
                    ? 'border-green-500 bg-green-50 shadow-lg shadow-green-100'
                    : 'border-gray-300 bg-white hover:border-indigo-300'
                    }`}
                onClick={handleCouponToggle}
            >
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center transition-all ${couponApplied ? 'bg-green-500 border-green-500' : 'bg-white border-gray-400'
                        }`}>
                        {couponApplied && <Check size={16} className="text-white font-bold" />}
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-900 text-base sm:text-lg">Apply ELITE Coupon</p>
                        <p className="text-xs sm:text-sm text-gray-600">Save ₹1,800 instantly!</p>
                    </div>
                    <Tag className="text-green-600" size={20} />
                </div>
            </motion.div>

            <div className="space-y-3 sm:space-y-4 text-base sm:text-lg">
                <div className="flex justify-between items-center text-gray-500">
                    <span className="text-sm sm:text-base">Original Price:</span>
                    <span className="line-through font-semibold">₹{originalPrice}</span>
                </div>

                {couponApplied && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex justify-between items-center text-green-600 font-bold bg-green-50 p-2 sm:p-3 rounded-xl"
                    >
                        <span className="text-sm sm:text-base">Discount:</span>
                        <span>- ₹{originalPrice - discountedPrice}</span>
                    </motion.div>
                )}

                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-3 sm:my-4"></div>

                <div className="flex justify-between items-center text-xl sm:text-2xl font-black text-gray-900">
                    <span>Final Price:</span>
                    <span className="text-indigo-600">₹{finalPrice}</span>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-4 sm:p-6 rounded-2xl mt-4 sm:mt-6 space-y-2 sm:space-y-3 text-white shadow-xl">
                    <div className="flex justify-between items-center font-bold text-lg sm:text-xl">
                        <span>Pay Now:</span>
                        <span>₹{prepaidAmount}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-indigo-100">
                        Balance ₹{balanceDue} payable on delivery
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
