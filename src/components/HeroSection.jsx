'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowDown, Play, Pause } from 'lucide-react';

export default function HeroSection() {
    const [currentVideo, setCurrentVideo] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const scrollToOrder = () => {
        const orderForm = document.getElementById('order-form');
        if (orderForm) {
            orderForm.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const videos = [
        {
            id: 0,
            src: '/product-demo-1.mp4',
            poster: '/product-desc.jpg',
            title: 'Product Demo',
            description: 'How EliteMarts Massager Works',
            thumbnail: '/product1.jpg'
        },
        {
            id: 1,
            src: '/customer-testimonial.mp4',
            poster: '/product1.jpg',
            title: 'Customer Review',
            description: 'Real User Experience',
            thumbnail: '/product2.jpg'
        },
        {
            id: 2,
            src: '/before-after-results.mp4',
            poster: '/product2.jpg',
            title: 'Results',
            description: 'Before & After Comparison',
            thumbnail: '/product3.jpg'
        },
    ];

    const handleVideoSelect = (videoIndex) => {
        setCurrentVideo(videoIndex);
        setIsPlaying(false);
    };

    return (
        <section className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 text-center px-4 max-w-5xl mx-auto py-12 sm:py-20"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full text-white mb-6 sm:mb-8 border border-white/30"
                >
                    <Sparkles size={18} className="text-yellow-300" />
                    <span className="font-semibold text-sm sm:text-base">Limited Time - 60% OFF</span>
                </motion.div>

                <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white mb-4 sm:mb-6 leading-tight px-2">
                    Robotic Neck & Shoulder
                    <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent mt-2">
                        Massager
                    </span>
                </h1>

                <p className="text-base sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-12 max-w-2xl mx-auto font-medium px-4">
                    Professional-grade relief at home. Experience instant relaxation in just 15 minutes.
                </p>

                {/* Interactive Video Player */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8 sm:mb-12 max-w-4xl mx-auto"
                >
                    <div className="text-center mb-6">
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                            See EliteMarts in Action
                        </h3>
                        <p className="text-white/80 text-sm sm:text-base">
                            Watch our product demos and customer testimonials
                        </p>
                    </div>

                    {/* Main Video Player */}
                    <motion.div
                        key={currentVideo}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl mb-6 border-4 border-white/30 bg-white max-w-md mx-auto"
                    >
                        <video
                            className="w-full h-auto object-contain"
                            controls
                            preload="metadata"
                            poster={videos[currentVideo].poster}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        >
                            <source src={videos[currentVideo].src} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>

                        {/* Video Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
                            <h4 className="text-white text-xl sm:text-2xl font-bold mb-1">
                                {videos[currentVideo].title}
                            </h4>
                            <p className="text-white/90 text-sm sm:text-base">
                                {videos[currentVideo].description}
                            </p>
                        </div>
                    </motion.div>

                    {/* Video Navigation - Simple Previous/Next */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex justify-center items-center gap-4 mb-4"
                    >
                        <button
                            onClick={() => handleVideoSelect((currentVideo - 1 + videos.length) % videos.length)}
                            className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors border border-white/30"
                        >
                            ← Previous
                        </button>

                        <span className="text-white/80 text-sm">
                            {currentVideo + 1} of {videos.length}
                        </span>

                        <button
                            onClick={() => handleVideoSelect((currentVideo + 1) % videos.length)}
                            className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors border border-white/30"
                        >
                            Next →
                        </button>
                    </motion.div>
                </motion.div>

                {/* CTA Buttons */}
                <div className="flex flex-col items-center gap-4 px-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full sm:w-auto bg-white text-indigo-700 px-6 sm:px-10 py-4 sm:py-5 rounded-full text-lg sm:text-xl font-bold shadow-2xl hover:shadow-3xl transition-all cursor-pointer group"
                        onClick={scrollToOrder}
                    >
                        <span className="flex items-center justify-center gap-2">
                            🚀 Order Now - ₹1,199 Only
                            <span className="line-through text-gray-500 text-sm sm:text-base">₹2,999</span>
                        </span>
                    </motion.button>

                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-white/80 flex items-center gap-2 text-sm sm:text-base"
                    >
                        <ArrowDown size={20} />
                        <span>Scroll to order</span>
                    </motion.div>
                </div>

                <p className="text-white/70 mt-6 text-xs sm:text-sm px-4">
                    ✓ Free Delivery | ✓ 4-6 Days Shipping | ✓ Cash on Delivery Available
                </p>
            </motion.div>
        </section>
    );
}
