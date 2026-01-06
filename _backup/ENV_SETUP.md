# Environment Configuration Guide

## Frontend Environment Variables

Create a file named `.env.local` in the `frontend/` directory with these variables:

```env
# Backend API URL (development)
NEXT_PUBLIC_API_URL=http://localhost:5000

# Your UPI ID for payments
# IMPORTANT: Replace with your actual UPI merchant ID
# Examples: yourname@paytm, yourmerchant@okaxis, business@ybl
NEXT_PUBLIC_UPI_ID=merchant@upi
```

## Backend Environment Variables

The `.env` file is already created in `backend/` directory:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
```

## Production Environment

For production deployment:

### Frontend (Vercel/Netlify)
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_UPI_ID=your-actual-upi-id@provider
```

### Backend (Render/Railway)
```env
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
```
