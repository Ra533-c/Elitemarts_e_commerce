'use client';

import { Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InstagramButton() {
    return (
        <motion.a
            href="https://www.instagram.com/elitemarts_?igsh=ZDVpYXRhaWxjYnV2"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-500 text-white p-4 rounded-full shadow-2xl hover:shadow-pink-500/50 transition-all group"
            aria-label="Contact us on Instagram"
        >
            <Instagram size={28} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-12 right-0 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Contact Us
            </span>
        </motion.a>
    );
}
