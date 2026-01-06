# EliteMarts - Single Product E-Commerce Site

Complete e-commerce website for selling Robotic Neck & Shoulder Massager with UPI payment integration and automated PDF invoice generation.

## 🚀 Features

- **Next.js 14+ Frontend** with App Router and Tailwind CSS
- **Express Backend** with PDF invoice generation
- **UPI Payment Integration** with QR code support
- **Coupon Code System** (ELITE1199 for 60% discount)
- **Responsive Design** - Mobile-first approach
- **Automated PDF Invoices** using PDFKit
- **3-Step Order Flow** - Form → Payment → Confirmation

## 📦 Tech Stack

### Frontend
- Next.js 14+
- React
- Tailwind CSS
- Axios (API calls)
- qrcode.react (UPI QR codes)

### Backend
- Node.js
- Express
- PDFKit (Invoice generation)
- UUID (Order ID generation)
- CORS middleware

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project:**
```bash
cd elitemarts
```

2. **Install Frontend Dependencies:**
```bash
cd frontend
npm install
```

3. **Install Backend Dependencies:**
```bash
cd ../backend
npm install
```

4. **Configure Environment Variables:**

**Frontend** - Create `.env.local` in `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_UPI_ID=your-upi-id@provider
```

**Backend** - Already created at `backend/.env`:
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
```

> **IMPORTANT:** Replace `your-upi-id@provider` with your actual UPI merchant ID (e.g., `yourname@paytm`, `business@okaxis`)

### Running the Application

**Development Mode:**

1. **Start Backend Server** (Terminal 1):
```bash
cd backend
npm run dev
```
Backend will run at: http://localhost:5000

2. **Start Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```
Frontend will run at: http://localhost:3000

3. **Access the Website:**
Open http://localhost:3000 in your browser

## 📱 How It Works

### User Flow

1. **Home Page** (`/`)
   - View product details, pricing, and features
   - Watch demo video
   - See discounted price with coupon code ELITE1199
   - Click "Order Now" to proceed

2. **Order Form** (`/order`)
   - **Step 1:** Enter customer details (name, mobile, address, city, state)
   - Enter coupon code ELITE1199 to get discount (₹2999 → ₹1199)
   - Client-side validation ensures all required fields are filled
   - Submit form to create order

3. **Payment** (Step 2)
   - Fixed booking fee of ₹600 via UPI
   - Scan QR code OR click payment button to open UPI app
   - Payment opens in Google Pay, PhonePe, Paytm, or other UPI apps
   - After payment, click "I have completed the payment"

4. **Confirmation** (Step 3)
   - Order confirmed with unique Order ID
   - Download PDF invoice
   - Estimated delivery: 4-6 days

### Backend Endpoints

- `POST /api/order` - Create new order
  - Validates customer data
  - Verifies coupon code
  - Generates unique order ID
  
- `POST /api/order/confirm` - Confirm payment
  - Generates PDF invoice
  - Returns invoice download link

- `GET /api/order/:orderId` - Get order details

- `GET /health` - Health check

## 💰 Pricing

- **Original Price:** ₹2,999
- **Discounted Price:** ₹1,199 (with code NEWYEAR26)
- **Booking Fee (UPI):** ₹600 (fixed)
- **Delivery:** 4-6 business days + rest of payment at the time of delivery(600Rs)

## 🎨 Customization

### Update Product Details
Edit `frontend/src/app/page.js` to modify:
- Product name and description
- Features list
- Pricing

### Update Coupon Code
Edit both:
- `frontend/src/app/order/page.js` (line ~20)
- `backend/routes/orders.js` (line ~5)

### Customize Invoice Design
Edit `backend/utils/invoice.js` to modify:
- Company information
- Invoice layout
- Colors and styling
- Terms & conditions

### Add Product Video
Place your video file at: `frontend/public/product-video.mp4`

## 📄 Invoice Details

Generated invoices include:
- Company header (EliteMarts)
- Order ID and date
- Customer information
- Product details with pricing
- Discount breakdown (if coupon applied)
- Booking fee paid (₹600)
- Delivery estimate
- Terms & conditions

Invoices are saved in `backend/invoices/` directory and accessible at `/invoices/{orderId}.pdf`

## 🚀 Deployment

### Frontend (Vercel - Recommended)

1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` - Your backend API URL
   - `NEXT_PUBLIC_UPI_ID` - Your UPI merchant ID
4. Deploy

### Backend (Render/Railway)

1. Push code to GitHub
2. Create new Web Service on [Render](https://render.com) or [Railway](https://railway.app)
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Set environment variables:
   - `PORT` - (auto-set by platform)
   - `FRONTEND_URL` - Your frontend URL
6. Deploy

### Alternative: Vercel Serverless Functions

Convert backend to Next.js API routes in `frontend/src/app/api/` for full-stack deployment on Vercel.

## 🔒 Security Notes

- Currently uses in-memory storage for orders (suitable for demo)
- For production, implement a database (MongoDB, PostgreSQL, etc.)
- Add authentication for admin panel
- Implement payment verification webhook
- Use environment variables for all sensitive data
- Enable HTTPS in production

## 📝 Todo for Production

- [ ] Replace `NEXT_PUBLIC_UPI_ID` with actual UPI merchant ID
- [ ] Add product demo video to `/public/product-video.mp4`
- [ ] Implement database for order storage
- [ ] Add email notifications for order confirmation
- [ ] Add SMS notifications for order updates
- [ ] Implement payment verification
- [ ] Add admin dashboard to view orders
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Add analytics (Google Analytics, Mixpanel)
- [ ] Implement order tracking

## 🐛 Troubleshooting

**Frontend can't connect to backend:**
- Ensure backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS settings in backend

**UPI payment not opening:**
- Test on actual mobile device (works best on Android/iOS)
- Ensure UPI ID is correctly formatted
- Check if UPI apps are installed

**Invoice not generating:**
- Check write permissions for `backend/invoices/` directory
- Verify PDFKit is installed
- Check backend console for errors

## 📧 Support

For issues or questions:
- Email: support@elitemarts.com
- Check backend logs for API errors
- Check browser console for frontend errors

## 🎯 Key Features Checklist

- ✅ Responsive mobile-first design
- ✅ Product page with images and video
- ✅ Order form with validation
- ✅ Coupon code system
- ✅ UPI payment integration with QR code
- ✅ PDF invoice generation
- ✅ Multi-step checkout flow
- ✅ Professional UI with Tailwind CSS
- ✅ Express REST API
- ✅ Error handling
- ✅ Environment configuration

---

**Built with ❤️ for EliteMarts**
