import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Register new admin (protected - only super_admin can create)
router.post('/register', (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        if (decoded.role !== 'super_admin') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}, async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const admin = new Admin({
            email,
            password,
            name,
            role: role || 'admin'
        });

        await admin.save();
        res.status(201).json({
            message: 'Admin registered successfully',
            admin: admin.toJSON()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const admin = await Admin.findOne({ email });
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

        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET || 'your-secret-key',
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

// Get current admin profile
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

// Update admin profile
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

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const admin = await Admin.findById(req.user.id);
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
