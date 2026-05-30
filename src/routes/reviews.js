import express from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateData, reviewSchema } from '../validation/schemas.js';

const router = express.Router();

// Get product reviews
router.get('/product/:productId', async (req, res) => {
    try {
        const { limit = 10, page = 1, sort = 'recent' } = req.query;

        let sortQuery = { createdAt: -1 };
        if (sort === 'helpful') {
            sortQuery = { helpful: -1 };
        } else if (sort === 'rating-high') {
            sortQuery = { rating: -1 };
        } else if (sort === 'rating-low') {
            sortQuery = { rating: 1 };
        }

        const reviews = await Review.find({ product: req.params.productId })
            .populate('user', 'name avatar')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort(sortQuery);

        const total = await Review.countDocuments({ product: req.params.productId });

        const stats = await Review.aggregate([
            { $match: { product: require('mongoose').Types.ObjectId(req.params.productId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    distribution: {
                        $push: '$rating'
                    }
                }
            }
        ]);

        res.json({
            reviews,
            total,
            pagination: {
                pages: Math.ceil(total / limit),
                page: parseInt(page)
            },
            stats: stats[0] || { averageRating: 0, totalReviews: 0 }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add review (only verified buyers)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const data = validateData(reviewSchema, req.body);
        const { productId } = req.body;

        // Check if user purchased this product
        const order = await Order.findOne({
            user: req.user.id,
            'items.product': productId,
            orderStatus: 'delivered'
        });

        if (!order) {
            return res.status(403).json({ error: 'Only verified buyers can review' });
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({
            product: productId,
            user: req.user.id
        });

        if (existingReview) {
            return res.status(400).json({ error: 'You already reviewed this product' });
        }

        const review = new Review({
            product: productId,
            user: req.user.id,
            ...data,
            verified: true
        });

        await review.save();
        await review.populate('user', 'name avatar');

        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update review
router.put('/:reviewId', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const data = validateData(reviewSchema, req.body);

        Object.assign(review, data);
        await review.save();

        res.json(review);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete review
router.delete('/:reviewId', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await Review.findByIdAndDelete(req.params.reviewId);

        res.json({ message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark as helpful
router.post('/:reviewId/helpful', async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.reviewId,
            { $inc: { helpful: 1 } },
            { new: true }
        );

        res.json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark as unhelpful
router.post('/:reviewId/unhelpful', async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.reviewId,
            { $inc: { unhelpful: 1 } },
            { new: true }
        );

        res.json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
