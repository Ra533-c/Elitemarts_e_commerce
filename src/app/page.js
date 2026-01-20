import HeroSection from "@/components/HeroSection";
import ProductShowcase from "@/components/ProductShowcase";
import OrderLookup from "@/components/OrderLookup";
import InstagramButton from "@/components/InstagramButton";
import CountdownTimer from "@/components/CountdownTimer";
import { Instagram, Package, RefreshCw } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Countdown Timer - Sticky at top */}
      <CountdownTimer />

      <HeroSection />

      <ProductShowcase />

      {/* Order Lookup Section */}
      <section className="py-12 sm:py-20 px-4 bg-white">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 px-4">
            Already Ordered?
          </h2>
          <p className="text-gray-600 text-base sm:text-lg px-4">
            Check your order status and payment verification
          </p>
        </div>

        <OrderLookup />
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                EliteMarts
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Premium home wellness products for modern living.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-base sm:text-lg">Policies</h4>
              <div className="space-y-3 text-gray-400 text-sm">
                <div className="flex items-start gap-2">
                  <Package size={16} className="shrink-0 mt-1 text-indigo-400" />
                  <div>
                    <p className="font-semibold text-white text-xs">Shipping:</p>
                    <p className="text-xs">₹600 prepaid required. Rest on delivery.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <RefreshCw size={16} className="shrink-0 mt-1 text-green-400" />
                  <div>
                    <p className="font-semibold text-white text-xs">Returns:</p>
                    <p className="text-xs">Full return & replacement within 7 days.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-base sm:text-lg">Contact Us</h4>
              <a
                href="https://www.instagram.com/elitemarts_?igsh=ZDVpYXRhaWxjYnV2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-6 py-3 rounded-full hover:shadow-lg hover:shadow-pink-500/50 transition-all font-semibold text-sm sm:text-base"
              >
                <Instagram size={20} />
                Follow us on Instagram
              </a>
              <p className="text-gray-400 mt-4 text-xs sm:text-sm">
                DM us for any queries or support
              </p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6 sm:pt-8 text-center text-gray-400 text-xs sm:text-sm">
            <p>© {new Date().getFullYear()} EliteMarts. All rights reserved.</p>
            <p className="mt-2 text-xs">Made with ❤️ in India</p>
          </div>
        </div>
      </footer>

      {/* Floating Instagram Button */}
      <InstagramButton />
    </main>
  );
}

