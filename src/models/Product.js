import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0,
            index: true
        },
        slug: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true,
            index: true
        },
        brand: {
            type: String,
            default: null,
            trim: true,
            index: true
        },
        discountedPrice: {
            type: Number,
            default: null
        },
        category: {
            type: String,
            required: true,
            index: true
        },
        subcategory: {
            type: String,
            default: null
        },
        image: {
            type: String,
            default: null
        },
        images: [String],
        stock: {
            type: Number,
            default: 0
        },
        specifications: {
            type: [String],
            default: []
        },
        inStock: {
            type: Boolean,
            default: true,
            index: true
        },
        featured: {
            type: Boolean,
            default: false,
            index: true
        },
        trending: {
            type: Boolean,
            default: false
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        reviewCount: {
            type: Number,
            default: 0
        },
        seller: {
            type: String,
            default: 'Surgical.io'
        },
        warranty: {
            type: String,
            default: null
        },
        sku: {
            type: String,
            unique: true,
            sparse: true
        },
        weight: {
            value: Number,
            unit: String
        },
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        },
        tags: [String],
        seoTitle: String,
        seoDescription: String,
        seoKeywords: [String],
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// Index for search
productSchema.index({ name: 'text', description: 'text', category: 'text' });

export default mongoose.model('Product', productSchema);
