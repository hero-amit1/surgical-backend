import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateData, orderSchema } from '../validation/schemas.js';

const router = express.Router();

// Create order from cart
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const data = validateData(orderSchema, req.body);

        const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const user = await User.findById(req.user.id);

        const order = new Order({
            user: req.user.id,
            items: cart.items.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.price,
                title: item.product.name
            })),
            shippingAddress: data.shippingAddress,
            paymentMethod: data.paymentMethod,
            subtotal: cart.totalPrice,
            tax: Math.round(cart.totalPrice * 0.18), // 18% GST
            total: Math.round(cart.totalPrice * 1.18),
            statusHistory: [
                {
                    status: 'pending',
                    timestamp: new Date(),
                    notes: 'Order created'
                }
            ]
        });

        await order.save();

        // Update user stats
        await User.findByIdAndUpdate(req.user.id, {
            totalSpent: user.totalSpent + order.total,
            orderCount: user.orderCount + 1
        });

        // Clear cart
        await Cart.findOneAndUpdate(
            { user: req.user.id },
            { items: [], totalItems: 0, totalPrice: 0 }
        );

        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user orders
router.get('/', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('items.product')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order details
router.get('/:orderId', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('items.product')
            .populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if user owns this order
        if (order.user._id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel order
router.put('/:orderId/cancel', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (!['pending', 'confirmed'].includes(order.orderStatus)) {
            return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
        }

        order.orderStatus = 'cancelled';
        order.cancelledAt = new Date();
        order.statusHistory.push({
            status: 'cancelled',
            timestamp: new Date(),
            notes: 'Cancelled by user'
        });

        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Track order
router.get('/:orderId/track', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .select('orderNumber orderStatus trackingNumber estimatedDelivery statusHistory');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all orders
router.get('/admin/all', async (req, res) => {
    try {
        const { status, startDate, endDate, limit = 50, page = 1 } = req.query;

        let query = {};

        if (status) {
            query.orderStatus = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('items.product', 'name image')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Order.countDocuments(query);

        res.json({
            orders,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page: parseInt(page)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
