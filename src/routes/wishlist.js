import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Add to wishlist
router.post('/add/:productId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user.wishlist.includes(req.params.productId)) {
            return res.status(400).json({ error: 'Product already in wishlist' });
        }

        user.wishlist.push(req.params.productId);
        await user.save();

        await user.populate('wishlist');

        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get wishlist
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('wishlist');
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove from wishlist
router.delete('/:productId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { wishlist: req.params.productId } },
            { new: true }
        ).populate('wishlist');

        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if product in wishlist
router.get('/check/:productId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const isInWishlist = user.wishlist.includes(req.params.productId);

        res.json({ inWishlist: isInWishlist });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
