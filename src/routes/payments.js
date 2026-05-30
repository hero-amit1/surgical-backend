import express from 'express';
import razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'your-key-id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'your-key-secret'
});

// Create payment order
router.post('/create-order', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: order.total * 100, // Convert to paise
            currency: 'INR',
            receipt: order.orderNumber,
            notes: {
                orderId: order._id,
                userId: req.user.id
            }
        });

        res.json({
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify payment
router.post('/verify-payment', authMiddleware, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your-key-secret')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        // Update order
        const order = await Order.findOne({ orderNumber: razorpay_order_id });
        if (order) {
            order.paymentStatus = 'completed';
            order.paymentId = razorpay_payment_id;
            order.orderStatus = 'confirmed';
            order.statusHistory.push({
                status: 'confirmed',
                timestamp: new Date(),
                notes: 'Payment verified - Order confirmed'
            });
            await order.save();
        }

        res.json({
            message: 'Payment verified successfully',
            orderId: order._id
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get payment status
router.get('/status/:razorpayOrderId', async (req, res) => {
    try {
        const payment = await razorpayInstance.orders.fetch(req.params.razorpayOrderId);
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Refund payment
router.post('/refund', authMiddleware, async (req, res) => {
    try {
        const { orderId, reason } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (order.paymentStatus !== 'completed') {
            return res.status(400).json({ error: 'Only completed payments can be refunded' });
        }

        const refund = await razorpayInstance.payments.refund(order.paymentId, {
            notes: { reason }
        });

        order.paymentStatus = 'refunded';
        order.statusHistory.push({
            status: 'refunded',
            timestamp: new Date(),
            notes: `Refund initiated: ${reason}`
        });
        await order.save();

        res.json({
            message: 'Refund initiated',
            refundId: refund.id,
            amount: refund.amount / 100
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
