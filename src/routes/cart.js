import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateData, cartItemSchema } from '../validation/schemas.js';

const router = express.Router();

// Get cart
router.get('/', authMiddleware, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
            await cart.save();
        }

        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add item to cart
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { productId, quantity } = validateData(cartItemSchema, req.body);

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({
                product: productId,
                quantity,
                price: product.price
            });
        }

        // Update totals
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await cart.save();
        await cart.populate('items.product');

        res.json(cart);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update cart item
router.put('/items/:itemId', authMiddleware, async (req, res) => {
    try {
        const { quantity } = req.body;

        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than 0' });
        }

        const cart = await Cart.findOne({ user: req.user.id });
        const item = cart.items.id(req.params.itemId);

        if (!item) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        item.quantity = quantity;

        cart.totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
        cart.totalPrice = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        await cart.save();
        await cart.populate('items.product');

        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove item from cart
router.delete('/items/:itemId', authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        cart.items.id(req.params.itemId).deleteOne();

        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await cart.save();
        await cart.populate('items.product');

        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear cart
router.delete('/', authMiddleware, async (req, res) => {
    try {
        await Cart.findOneAndUpdate(
            { user: req.user.id },
            { items: [], totalItems: 0, totalPrice: 0 }
        );

        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
