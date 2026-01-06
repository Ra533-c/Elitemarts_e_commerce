# 🛍️ EliteMarts - Robotic Neck & Shoulder Massager E-Commerce

A modern, mobile-first single-page e-commerce application for selling premium robotic neck and shoulder massagers with integrated UPI payment system.

![EliteMarts](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)

## ✨ Features

### 🎯 Core Features
- **One-Click Ordering** - Streamlined checkout process
- **UPI Payment Integration** - QR code and deep link support
- **Order Status Tracking** - Real-time order lookup by ID
- **Pincode Auto-Detection** - Automatic city/state filling using India Post API
- **Dynamic Countdown Timer** - Personalized 24-hour flash sale deadline
- **Mobile-First Design** - Optimized for all devices (320px - 1920px)

### 🎨 UI/UX Features
- **Celebration Animations** - Confetti on coupon apply and order success
- **Interactive Image Gallery** - Clickable product images with modal view
- **Smooth Animations** - Framer Motion powered transitions
- **Modern Typography** - Inter & Poppins Google Fonts
- **Gradient Design System** - Indigo to Purple color scheme

### 💳 Payment Features
- **Real UPI Payments** - Direct bank transfer via QR code
- **Manual Verification** - Admin panel for payment confirmation
- **Prepaid + COD** - ₹600 booking fee + balance on delivery
- **Order ID Tracking** - Check payment status anytime

### 📱 Mobile Optimizations
- **Responsive Design** - Perfect on all screen sizes
- **Touch-Friendly** - 44px minimum touch targets
- **Fast Loading** - Optimized images and code splitting
- **PWA Ready** - Can be installed as app

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS 4.0
- **Animations:** Framer Motion, canvas-confetti
- **Forms:** React Hook Form + Zod validation
- **UI Components:** Headless UI
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

### Backend
- **Database:** MongoDB Atlas
- **APIs:** Next.js API Routes
- **Payment:** UPI Deep Links
- **PDF Generation:** jsPDF

### External APIs
- **India Post API** - Pincode lookup
- **MongoDB Atlas** - Cloud database

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Git installed

### Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/elitemarts.git
cd elitemarts
```

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create `.env.local` file:
```env
MONGODB_URI=your_mongodb_connection_string
UPI_ID=your_upi_id
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment

### Deploy to Vercel (Recommended)
1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

**Live URL:** `https://your-project.vercel.app`

## 📱 Features Breakdown

### 1. Dynamic Countdown Timer
- Personalized 24-hour deadline per user
- Stored in localStorage
- Auto-resets when expired
- Fully responsive

### 2. Pincode Auto-Detection
```javascript
// Enter 6-digit pincode → Auto-fills city & state
// Uses India Post API
https://api.postalpincode.in/pincode/{pincode}
```

### 3. Payment Flow
1. Customer fills order form
2. Pays ₹600 via UPI (QR/App)
3. Saves Order ID
4. Admin verifies payment (within 24h)
5. Customer checks status anytime

### 4. Order Status Lookup
- Search by Order ID
- Shows payment status
- Real-time updates
- Clear pending/paid states

## 🎯 User Flow

```
Landing → Product Showcase → Order Form → Payment → Confirmation
                                    ↓
                            Order Status Lookup
```

## 🔧 Configuration

### MongoDB Setup
1. Create MongoDB Atlas account
2. Create cluster
3. Get connection string
4. Add to `.env.local`

### UPI Configuration
Update `UPI_ID` in `.env.local`:
```env
UPI_ID=yourname@bank
```

## 📊 Admin Panel

Access: `/admin`
Password: `admin123` (change in production!)

**Features:**
- View pending orders
- Verify payments manually
- See order details

## 🎨 Customization

### Colors
Edit `src/app/globals.css`:
```css
--primary-600: #6366f1;
--accent-500: #10b981;
```

### Pricing
Edit `src/components/PricingCard.jsx`:
```javascript
const originalPrice = 2999;
const discountedPrice = 1199;
const prepaidAmount = 600;
```

### Product Images
Replace images in `/public/`:
- `product1.jpg` to `product5.jpg`
- `product-desc.jpg`
- `product-thumbnail.jpg`

## 📱 Mobile Testing

### Method 1: Same WiFi
```bash
npm run dev -- -H 0.0.0.0
# Access: http://YOUR_IP:3000
```

### Method 2: ngrok
```bash
ngrok http 3000
# Access: https://xxx.ngrok-free.app
```

### Method 3: Vercel Deploy
Deploy to Vercel for permanent URL

## 🐛 Troubleshooting

### Build Errors
```bash
npm run build
```

### Clear Cache
```bash
rm -rf .next
npm run dev
```

### Port Already in Use
```bash
npm run dev -- -p 3001
```

## 📄 License

MIT License - Free to use and modify

## 👨‍💻 Author

**EliteMarts Team**
- Instagram: [@elitemarts_](https://www.instagram.com/elitemarts_?igsh=ZDVpYXRhaWxjYnV2)

## 🙏 Acknowledgments

- Next.js Team
- Tailwind CSS
- Vercel
- MongoDB Atlas
- India Post API

## 📞 Support

For queries, DM us on Instagram: [@elitemarts_](https://www.instagram.com/elitemarts_?igsh=ZDVpYXRhaWxjYnV2)

---

**Made with ❤️ in India** 🇮🇳
