import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import adminRoutes from './routes/admin.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import wishlistRoutes from './routes/wishlist.js';
import searchRoutes from './routes/search.js';
import analyticsRoutes from './routes/analytics.js';
import paymentRoutes from './routes/payments.js';

const app = express();

/* ---------------- MIDDLEWARE ---------------- */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : '*',
    credentials: true,
  })
);

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* ---------------- TEST ROUTES ---------------- */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Surgical Backend is Running 🚀',
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

/* ---------------- API ROUTES ---------------- */
app.use('/api/admin', adminRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);

/* ---------------- START SERVER ---------------- */
const start = async () => {
  try {
    // Accept both env names (fix common Render mistake)
    const mongoUri =
      process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ MONGODB_URI or MONGO_URI is missing in Render env');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');

    await mongoose.connect(mongoUri);

    console.log('✅ MongoDB Connected Successfully');

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (error) {
    console.error('❌ MongoDB Connection Failed');
    console.error(error);
    process.exit(1);
  }
};

start();