import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        title: {
            type: String,
            required: true,
            maxlength: 100
        },
        comment: {
            type: String,
            required: true,
            maxlength: 1000
        },
        helpful: {
            type: Number,
            default: 0
        },
        unhelpful: {
            type: Number,
            default: 0
        },
        verified: {
            type: Boolean,
            default: false
        },
        images: [String]
    },
    { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
