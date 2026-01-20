'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import gsap from 'gsap';
import OrderForm from '@/components/OrderForm';
import CountdownTimer from '@/components/CountdownTimer';
import PageTransition from '@/components/PageTransition';
import { getPaymentSession } from '@/lib/usePaymentSession';

export default function OrderPage() {
    const router = useRouter();
    const pageRef = useRef(null);

    // Check for pending payment session on mount
    useEffect(() => {
        // Don't redirect if user is coming back after rejection (for retry with auto-fill)
        const hasRejectedData = localStorage.getItem('elitemarts_rejected_customer');
        if (hasRejectedData) {
            // User is retrying after rejection, let them stay
            return;
        }

        const session = getPaymentSession();
        if (session) {
            // Redirect to payment waiting if there's a pending session
            router.push('/payment-waiting');
        }
    }, [router]);

    // GSAP entrance animation
    useEffect(() => {
        if (pageRef.current) {
            gsap.fromTo(
                '.order-card',
                { y: 60, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
            );
        }
    }, []);

    const handleBack = () => {
        router.push('/');
    };

    return (
        <PageTransition>
            <main ref={pageRef} className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
                {/* Countdown Timer - Sticky at top */}
                <CountdownTimer />

                {/* Back Button */}
                <div className="max-w-4xl mx-auto px-4 pt-6">
                    <motion.button
                        onClick={handleBack}
                        whileHover={{ scale: 1.02, x: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors font-medium group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Go Back</span>
                    </motion.button>
                </div>

                {/* Order Section */}
                <section className="py-8 sm:py-12 px-4">
                    <div className="text-center mb-8 sm:mb-12">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 px-4">
                            Order Your Relief Today
                        </h1>
                        <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
                            Almost there! Fill in your details below to secure your Robotic Neck & Shoulder Massager.
                        </p>
                    </div>

                    <div className="order-card">
                        <OrderForm />
                    </div>
                </section>
            </main>
        </PageTransition>
    );
}
