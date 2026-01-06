'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { X, ZoomIn } from 'lucide-react';

const productImages = [
    { src: '/product1.jpg', alt: 'Neck Massager in Use' },
    { src: '/product2.jpg', alt: 'Product Features' },
    { src: '/product3.jpg', alt: 'Product Design' },
    { src: '/product4.jpg', alt: 'Product Details' },
    { src: '/product-desc.jpg', alt: 'Product Specifications' }
];

const features = [
    {
        icon: '🤲',
        title: "Simulated Human Hand",
        desc: "Designed to mimic professional massage techniques with precision."
    },
    {
        icon: '🔥',
        title: "Dual Zone Heat",
        desc: "Soothing heat therapy for neck and shoulders."
    },
    {
        icon: '🔋',
        title: "Wireless Design",
        desc: "Rechargeable 2000mAh battery for 2+ hours of use."
    },
    {
        icon: '✨',
        title: "Premium Leather",
        desc: "Skin-friendly, durable, and easy to clean materials."
    }
];

export default function ProductShowcase() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [mainImage, setMainImage] = useState(productImages[0]);

    return (
        <>
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
                            Why Choose EliteMarts?
                        </h2>
                        <p className="text-gray-600 text-xl max-w-2xl mx-auto">
                            Experience the next generation of relaxation technology with premium quality and design.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
                        {/* Main Image Display */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            className="space-y-4"
                        >
                            <div
                                className="relative rounded-3xl overflow-hidden shadow-2xl h-[400px] md:h-[500px] cursor-pointer group"
                                onClick={() => setSelectedImage(mainImage)}
                            >
                                <Image
                                    src={mainImage.src}
                                    alt={mainImage.alt}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={48} />
                                </div>
                            </div>

                            {/* Thumbnail Gallery */}
                            <div className="grid grid-cols-5 gap-3">
                                {productImages.map((img, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setMainImage(img)}
                                        className={`relative h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${mainImage.src === img.src
                                                ? 'border-indigo-600 shadow-lg'
                                                : 'border-gray-200 hover:border-indigo-300'
                                            }`}
                                    >
                                        <Image
                                            src={img.src}
                                            alt={img.alt}
                                            fill
                                            className="object-cover"
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Features List */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex gap-5 items-start p-6 rounded-2xl hover:bg-indigo-50 transition-colors group"
                                >
                                    <div className="text-4xl shrink-0 group-hover:scale-110 transition-transform">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Image Modal */}
            <Dialog
                open={selectedImage !== null}
                onClose={() => setSelectedImage(null)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="relative max-w-4xl w-full">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <X size={32} />
                        </button>

                        {selectedImage && (
                            <div className="relative h-[80vh] rounded-2xl overflow-hidden">
                                <Image
                                    src={selectedImage.src}
                                    alt={selectedImage.alt}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        )}
                    </Dialog.Panel>
                </div>
            </Dialog>
        </>
    );
}
