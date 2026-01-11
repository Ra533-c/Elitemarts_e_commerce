# 🤖 AI Agent Quick Reference Guide
# EliteMarts E-commerce Platform

## 📍 Quick Navigation

### Entry Points
- **Home Page:** `src/app/page.js` - Main landing page with product showcase
- **Admin Panel:** `src/app/admin/page.js` - Payment verification dashboard
- **Order Tracking:** `src/app/track/page.js` - Customer order lookup
- **Success Page:** `src/app/success/page.js` - Post-payment confirmation

### Core API Routes
```
/api/payment/session          → Create payment session
/api/payment/verify-and-create → Verify payment & create order
/api/order/route              → Fetch order details
/api/order/track              → Track order status
/api/admin/orders             → Admin order management
/api/telegram/webhook         → Telegram bot webhook
```

---

## 🗂️ File Structure Map

### Components (`src/components/`)
```
OrderForm.jsx              → Main order form with validation
PaymentGateway.jsx         → Payment processing UI
ProductShowcase.jsx        → Product display carousel
HeroSection.jsx            → Landing page hero
CountdownTimer.jsx         → Flash sale timer
OrderLookup.jsx            → Order tracking search
AdminPaymentVerification   → Admin verification panel
CelebrationAnimation.jsx   → Success animations
PricingCard.jsx            → Pricing display
InstagramButton.jsx        → Social media link
```

### Libraries (`src/lib/`)
```
database.js        → MongoDB connection & queries
telegram.js        → Telegram bot initialization
notifications.js   → Notification system
clientInvoice.js   → PDF invoice generation
utils.js           → Utility functions
```

---

## 🔄 Data Flow

### Order Creation Flow
```
1. User fills OrderForm.jsx
2. POST /api/payment/session → Creates session in MongoDB
3. PaymentGateway.jsx → Shows payment options
4. User completes payment
5. Admin verifies via Telegram or Admin Panel
6. POST /api/payment/verify-and-create → Creates order
7. Telegram notification sent with Order ID
8. User redirected to success page
9. PDF invoice generated
```

### Order Tracking Flow
```
1. User visits /track page
2. Enters Order ID or Phone Number
3. GET /api/order/track → Fetches order from MongoDB
4. Display order status with progress bar
5. Show delivery timeline (4-6 days)
```

---

## 💾 Database Schema

### Collections

#### `paymentSessions`
```javascript
{
  sessionId: "SESSION-timestamp-random",
  customerData: {
    name: String,
    phone: String,
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  pricing: {
    bookingFee: 600,
    balanceOnDelivery: 1399,
    total: 1999
  },
  paymentStatus: "pending" | "verified" | "failed",
  orderId: String,  // Set after order creation
  verifiedAt: Date,
  verifiedBy: "telegram_admin" | "instamojo",
  createdAt: Date,
  expiresAt: Date  // 24 hours from creation
}
```

#### `orders`
```javascript
{
  orderId: "ORD-timestamp-random",
  customerName: String,
  phone: String,
  email: String,
  address: Object,
  pricing: Object,
  paymentStatus: "paid",
  deliveryStatus: "processing" | "shipped" | "out_for_delivery" | "delivered",
  status: "confirmed",
  paymentSessionId: String,
  estimatedDelivery: {
    start: Date,  // 4 days from now
    end: Date,    // 6 days from now
    days: "4-6 business days"
  },
  trackingHistory: [
    {
      status: String,
      timestamp: Date,
      message: String
    }
  ],
  createdAt: Date,
  paymentVerifiedAt: Date,
  verifiedBy: String
}
```

---

## 🔑 Environment Variables

### Required
```env
MONGODB_URI                 → MongoDB Atlas connection string
TELEGRAM_BOT_TOKEN          → Telegram bot API token
TELEGRAM_ADMIN_CHAT_ID      → Admin's Telegram chat ID
ADMIN_KEY                   → Admin panel password
INSTAMOJO_LINK              → Payment gateway link
UPI_ID                      → UPI payment ID
```

### Optional
```env
NEXT_PUBLIC_SITE_URL        → Site URL (default: localhost:3000)
WEBHOOK_SECRET              → Webhook security token
NEXT_PUBLIC_APP_URL         → App URL for production
```

---

## 🎨 UI Components Breakdown

### OrderForm.jsx
- **Purpose:** Collect customer details and create payment session
- **Validation:** Zod schema with phone, email, pincode validation
- **Features:** Auto-fill city/state from pincode
- **Output:** Payment session ID

### PaymentGateway.jsx
- **Purpose:** Display payment options and handle payment
- **Methods:** Instamojo link, UPI QR code
- **Timer:** 10-minute countdown for payment
- **Polling:** Checks payment status every 5 seconds

### ProductShowcase.jsx
- **Purpose:** Display product images and details
- **Features:** Image carousel, specifications, benefits
- **Responsive:** Mobile and desktop optimized

### AdminPaymentVerification.jsx
- **Purpose:** Admin dashboard for payment verification
- **Features:** View pending payments, verify/reject
- **Security:** Protected by ADMIN_KEY

---

## 🤖 Telegram Bot Commands

### User Commands
```
/start  → Welcome message + Chat ID
/help   → List of available commands
```

### Admin Commands
```
/verify SESSION-ID  → Verify payment and create order
/reject SESSION-ID  → Reject payment
```

### Inline Buttons
- ✅ Verify → Approves payment
- ❌ Reject → Rejects payment

---

## 📱 API Endpoints Reference

### Payment APIs
```javascript
POST /api/payment/session
Body: { customerData, pricing }
Returns: { sessionId, expiresAt }

POST /api/payment/verify-and-create
Body: { sessionId, verifiedBy }
Returns: { success, orderId, order }
```

### Order APIs
```javascript
GET /api/order/route?sessionId=XXX
Returns: { order, session }

POST /api/order/track
Body: { orderId } or { phone }
Returns: { order, trackingHistory }

GET /api/order/status?sessionId=XXX
Returns: { status, orderId }
```

### Admin APIs
```javascript
GET /api/admin/orders
Headers: { x-admin-key }
Returns: { sessions: [], orders: [] }

POST /api/admin/sessions
Body: { sessionId, action: "verify" | "reject" }
Returns: { success, orderId }
```

---

## 🔧 Common Patterns

### Error Handling
```javascript
try {
  // Operation
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Error message' },
    { status: 500 }
  );
}
```

### Database Connection
```javascript
import { connectDB, getDB } from '@/lib/database';
await connectDB();
const db = getDB();
const collection = db.collection('collectionName');
```

### API Response Format
```javascript
// Success
{ success: true, data: {...} }

// Error
{ error: "Error message", details: {...} }
```

---

## 🚀 Deployment Checklist

### Local Development
- [ ] Install dependencies: `npm install`
- [ ] Configure `.env.local`
- [ ] Start dev server: `npm run dev`
- [ ] Test payment flow
- [ ] Test Telegram bot (polling mode)

### Production (Vercel)
- [ ] Push code to Git
- [ ] Configure Vercel environment variables
- [ ] Deploy to Vercel
- [ ] Set Telegram webhook: `/api/telegram/webhook?action=set`
- [ ] Test production payment flow
- [ ] Verify Telegram notifications

---

## 🐛 Common Issues & Solutions

### Issue: MongoDB Connection Failed
**Solution:** Check `MONGODB_URI` in environment variables

### Issue: Telegram Bot Not Responding
**Solution:** 
- Local: Check if bot is initialized (polling mode)
- Production: Verify webhook is set correctly

### Issue: Payment Not Verifying
**Solution:** Check admin key, verify session hasn't expired

### Issue: Order Not Creating
**Solution:** Ensure payment is verified first, check MongoDB connection

---

## 📊 Performance Metrics

- Payment Session Creation: < 200ms
- Order Creation: < 300ms
- Order Tracking: < 150ms
- PDF Generation: < 500ms
- Telegram Notification: < 100ms

---

## 🔐 Security Features

- Admin panel protected by `ADMIN_KEY`
- Payment sessions expire after 24 hours
- Webhook secured with `WEBHOOK_SECRET`
- Input validation with Zod schemas
- MongoDB injection prevention
- CORS configured for API routes

---

## 📚 Dependencies

### Production
- next: 16.1.1
- react: 19.2.3
- mongodb: ^7.0.0
- node-telegram-bot-api: ^0.67.0
- jspdf: ^4.0.0
- framer-motion: ^12.24.0
- react-hook-form: ^7.70.0
- zod: ^4.3.5

### Development
- tailwindcss: ^4
- eslint: ^9
- postcss: ^8.5.6

---

**Generated:** January 11, 2026  
**For:** AI Agent Quick Reference  
**Project:** EliteMarts E-commerce Platform
