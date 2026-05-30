import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateData, registerSchema, loginSchema } from '../validation/schemas.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const data = validateData(registerSchema, req.body);

        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const user = new User({
            name: data.name,
            email: data.email,
            password: data.password
        });

        await user.save();

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const data = validateData(loginSchema, req.body);

        const user = await User.findOne({ email: data.email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await user.comparePassword(data.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: user.toJSON()
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('wishlist');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user.toJSON());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, phone, avatar },
            { new: true }
        );
        res.json(user.toJSON());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add address
router.post('/addresses', authMiddleware, async (req, res) => {
    try {
        const { label, street, city, state, pincode, country, isDefault } = req.body;

        if (isDefault) {
            await User.findByIdAndUpdate(req.user.id, {
                $set: { 'addresses.$[].isDefault': false }
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                $push: {
                    addresses: { label, street, city, state, pincode, country, isDefault }
                }
            },
            { new: true }
        );

        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete address
router.delete('/addresses/:addressId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { addresses: { _id: req.params.addressId } } },
            { new: true }
        );
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
