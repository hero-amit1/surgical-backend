import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const router = express.Router();

// Sales analytics
router.get('/sales', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = { paymentStatus: 'completed' };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const salesData = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$total' },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: '$total' },
                    totalProfit: {
                        $sum: { $subtract: ['$total', { $multiply: ['$subtotal', 0.3] }] }
                    }
                }
            }
        ]);

        res.json(salesData[0] || {
            totalSales: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            totalProfit: 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Revenue by date
router.get('/revenue', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = { paymentStatus: 'completed' };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const revenueData = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(revenueData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Top products
router.get('/products/top', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const topProducts = await Order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: limit * 1 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            }
        ]);

        res.json(topProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User statistics
router.get('/users/stats', async (req, res) => {
    try {
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    },
                    totalSpent: { $sum: '$totalSpent' },
                    averageSpent: { $avg: '$totalSpent' }
                }
            }
        ]);

        res.json(userStats[0] || {
            totalUsers: 0,
            activeUsers: 0,
            totalSpent: 0,
            averageSpent: 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Order status distribution
router.get('/orders/status', async (req, res) => {
    try {
        const statusDistribution = await Order.aggregate([
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(statusDistribution);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dashboard overview
router.get('/overview', async (req, res) => {
    try {
        const [sales, users, orders, products] = await Promise.all([
            Order.countDocuments({ paymentStatus: 'completed' }),
            User.countDocuments(),
            Order.countDocuments(),
            Product.countDocuments()
        ]);

        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        res.json({
            totalOrders: orders,
            completedOrders: sales,
            totalUsers: users,
            totalProducts: products,
            totalRevenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
