import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Search products
router.get('/search', async (req, res) => {
    try {
        const { query, category, minPrice, maxPrice, sort, limit = 20, page = 1 } = req.query;

        let searchQuery = {};

        if (query) {
            searchQuery.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ];
        }

        if (category) {
            searchQuery.category = { $regex: category, $options: 'i' };
        }

        if (minPrice || maxPrice) {
            searchQuery.price = {};
            if (minPrice) searchQuery.price.$gte = parseInt(minPrice);
            if (maxPrice) searchQuery.price.$lte = parseInt(maxPrice);
        }

        if (query) {
            searchQuery.inStock = true;
        }

        let sortQuery = { createdAt: -1 };
        if (sort === 'price-low') {
            sortQuery = { price: 1 };
        } else if (sort === 'price-high') {
            sortQuery = { price: -1 };
        } else if (sort === 'name') {
            sortQuery = { name: 1 };
        } else if (sort === 'popular') {
            sortQuery = { featured: -1 };
        }

        const products = await Product.find(searchQuery)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort(sortQuery);

        const total = await Product.countDocuments(searchQuery);

        res.json({
            products,
            total,
            pagination: {
                pages: Math.ceil(total / limit),
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get categories
router.get('/categories/list', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const products = await Product.find({ featured: true })
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get trending products
router.get('/trending/list', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const products = await Product.find({ trending: true, inStock: true })
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Filter by price range
router.get('/filter/price', async (req, res) => {
    try {
        const { minPrice, maxPrice } = req.query;

        const aggregation = [
            {
                $match: {
                    price: {
                        $gte: parseInt(minPrice || 0),
                        $lte: parseInt(maxPrice || 1000000)
                    }
                }
            },
            {
                $group: {
                    _id: '$category',
                    products: { $push: '$$ROOT' },
                    count: { $sum: 1 }
                }
            }
        ];

        const results = await Product.aggregate(aggregation);

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get price range
router.get('/filter/price-range', async (req, res) => {
    try {
        const priceStats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }
        ]);

        res.json(priceStats[0] || { minPrice: 0, maxPrice: 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
