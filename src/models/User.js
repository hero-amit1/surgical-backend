import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            match: /.+\@.+\..+/
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        phone: {
            type: String,
            default: null
        },
        avatar: {
            type: String,
            default: null
        },
        addresses: [
            {
                label: String,
                street: String,
                city: String,
                state: String,
                pincode: String,
                country: String,
                isDefault: Boolean
            }
        ],
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            }
        ],
        totalSpent: {
            type: Number,
            default: 0
        },
        orderCount: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        emailVerified: {
            type: Boolean,
            default: false
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date
    },
    { timestamps: true }
);

userSchema.methods.comparePassword = async function (enteredPassword) {
    const bcryptjs = await import('bcryptjs');
    return await bcryptjs.default.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const bcryptjs = await import('bcryptjs');
        const salt = await bcryptjs.default.genSalt(10);
        this.password = await bcryptjs.default.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpire;
    return obj;
};

export default mongoose.model('User', userSchema);
