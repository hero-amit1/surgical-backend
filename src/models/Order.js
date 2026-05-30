import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            unique: true,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product'
                },
                quantity: Number,
                price: Number,
                title: String
            }
        ],
        shippingAddress: {
            name: String,
            email: String,
            phone: String,
            street: String,
            city: String,
            state: String,
            pincode: String,
            country: String
        },
        paymentMethod: {
            type: String,
            enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet'],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        paymentId: String,
        orderStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        },
        subtotal: {
            type: Number,
            required: true
        },
        shipping: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        },
        notes: String,
        trackingNumber: String,
        estimatedDelivery: Date,
        deliveredAt: Date,
        cancelledAt: Date,
        statusHistory: [
            {
                status: String,
                timestamp: {
                    type: Date,
                    default: Date.now
                },
                notes: String
            }
        ]
    },
    { timestamps: true }
);

// Auto-generate order number
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

export default mongoose.model('Order', orderSchema);
