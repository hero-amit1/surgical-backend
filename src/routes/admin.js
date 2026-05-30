import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/* ---------------- REGISTER ADMIN ---------------- */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const admin = await Admin.create({
            email,
            password,
            name,
            role: role || 'admin'
        });

        res.status(201).json({
            message: 'Admin registered successfully',
            admin: admin.toJSON()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ---------------- LOGIN ---------------- */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // 🔥 IMPORTANT FIX: include password explicitly
        const admin = await Admin.findOne({ email }).select('+password');

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await admin.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!admin.isActive) {
            return res.status(403).json({ error: 'Account is inactive' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET missing' });
        }

        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            admin: admin.toJSON()
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ---------------- PROFILE ---------------- */
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        res.json(admin.toJSON());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ---------------- UPDATE PROFILE ---------------- */
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;

        const admin = await Admin.findByIdAndUpdate(
            req.user.id,
            { name },
            { new: true }
        );

        res.json(admin.toJSON());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ---------------- CHANGE PASSWORD ---------------- */
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const admin = await Admin.findById(req.user.id).select('+password');

        const isValid = await admin.comparePassword(currentPassword);

        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        admin.password = newPassword;
        await admin.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;