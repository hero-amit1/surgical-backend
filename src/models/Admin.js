import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const adminSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: /.+\@.+\..+/
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false // 🔥 prevents password from being returned in queries
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        role: {
            type: String,
            enum: ['admin', 'super_admin'],
            default: 'admin'
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

/* ---------------- PASSWORD HASH ---------------- */
adminSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) return next();

        const salt = await bcryptjs.genSalt(10);
        this.password = await bcryptjs.hash(this.password, salt);

        next();
    } catch (error) {
        next(error);
    }
});

/* ---------------- COMPARE PASSWORD ---------------- */
adminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcryptjs.compare(enteredPassword, this.password);
};

/* ---------------- REMOVE PASSWORD FROM JSON ---------------- */
adminSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

export default mongoose.model('Admin', adminSchema);