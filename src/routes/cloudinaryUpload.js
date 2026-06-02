import express from 'express';
import multer from 'multer';

import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Temporary disk storage (server-side upload folder)
const upload = multer({
    dest: 'backend/uploads',
});

// Upload single image -> returns Cloudinary URL
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        const { path, mimetype } = req.file;

        // cloudinary expects local file path
        const result = await cloudinary.uploader.upload(path, {
            resource_type: 'image',
            folder: 'surgicall/admin-images',
            public_id: undefined,
            // optional: make it nicer
            ...(mimetype ? { format: mimetype.split('/')[1] } : null),
        });

        return res.json({
            url: result.secure_url,
            public_id: result.public_id,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;

