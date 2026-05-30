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

app.use(helmet());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(',')?.map(s => s.trim()) || '*',
        credentials: true
    })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false
    })
);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Admin Routes
app.use('/api/admin', adminRoutes);

// Customer Routes
app.use('/api/auth', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Product Routes
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);

// Analytics & Payments
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);

const start = async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('Missing MONGODB_URI');
        process.exit(1);
    }

    await mongoose.connect(mongoUri);

    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Backend listening on ${port}`));
};

start().catch(err => {
    console.error(err);
    process.exit(1);
});

