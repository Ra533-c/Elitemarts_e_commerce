'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';

export default function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [deadline, setDeadline] = useState(null);

    useEffect(() => {
        // Get or create deadline (24 hours from first visit)
        let storedDeadline = localStorage.getItem('elitemarts_deadline');

        if (!storedDeadline) {
            // Create new deadline 24 hours from now
            const newDeadline = new Date().getTime() + (24 * 60 * 60 * 1000);
            localStorage.setItem('elitemarts_deadline', newDeadline.toString());
            storedDeadline = newDeadline.toString();
        }

        setDeadline(parseInt(storedDeadline));
    }, []);

    useEffect(() => {
        if (!deadline) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = deadline - now;

            if (distance < 0) {
                // Deadline passed, create new one
                const newDeadline = new Date().getTime() + (24 * 60 * 60 * 1000);
                localStorage.setItem('elitemarts_deadline', newDeadline.toString());
                setDeadline(newDeadline);
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft({ hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(timer);
    }, [deadline]);

    if (!deadline) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white py-3 px-4 sticky top-0 z-40 shadow-lg"
        >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
                <div className="flex items-center gap-2">
                    <Zap size={20} fill="currentColor" className="animate-pulse" />
                    <span className="font-bold text-sm sm:text-base">FLASH SALE ENDS IN:</span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg min-w-[50px] sm:min-w-[60px]">
                        <div className="text-xl sm:text-2xl font-black">{String(timeLeft.hours).padStart(2, '0')}</div>
                        <div className="text-[10px] sm:text-xs font-semibold opacity-90">HOURS</div>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold">:</span>
                    <div className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg min-w-[50px] sm:min-w-[60px]">
                        <div className="text-xl sm:text-2xl font-black">{String(timeLeft.minutes).padStart(2, '0')}</div>
                        <div className="text-[10px] sm:text-xs font-semibold opacity-90">MINS</div>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold">:</span>
                    <div className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg min-w-[50px] sm:min-w-[60px]">
                        <div className="text-xl sm:text-2xl font-black">{String(timeLeft.seconds).padStart(2, '0')}</div>
                        <div className="text-[10px] sm:text-xs font-semibold opacity-90">SECS</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
