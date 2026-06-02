import express from 'express';
import Product from '../models/Product.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product by id
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product (protected)
router.post('/', authMiddleware, async (req, res) => {
    try {
        // image is expected to be a Cloudinary URL now
        const {
            name,
            slug,
            brand,
            subcategory,
            description,
            price,
            category,
            image,
            stock,
            sku,
            featured,
            trending,
            specifications,
        } = req.body;


        if (!name || !slug || !description || !price || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const specs = Array.isArray(specifications)
            ? specifications
            : typeof specifications === 'string'
                ? specifications.split('\n').map((line) => line.trim()).filter(Boolean)
                : [];

        const product = new Product({
            name,
            slug,
            brand,
            subcategory,
            description,
            price,
            category,
            image,
            stock: stock || 0,
            inStock: Number(stock) > 0,
            sku,
            featured: Boolean(featured),
            trending: Boolean(trending),
            specifications: specs,
        });

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update product (protected)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const {
            name,
            slug,
            brand,
            subcategory,
            description,
            price,
            category,
            image,
            stock,
            sku,
            featured,
            trending,
            specifications,
        } = req.body;


        const specs = Array.isArray(specifications)
            ? specifications
            : typeof specifications === 'string'
                ? specifications.split('\n').map((line) => line.trim()).filter(Boolean)
                : [];

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name,
                slug,
                brand,
                subcategory,
                description,
                price,
                category,
                image,
                stock,
                sku,
                featured: Boolean(featured),
                trending: Boolean(trending),
                specifications: specs,
                inStock: Number(stock) > 0,
            },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
