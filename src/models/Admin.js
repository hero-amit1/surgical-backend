import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

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
            select: false // hidden by default
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        role: {
            type: String,
            enum: ["admin", "super_admin"],
            default: "admin"
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

/* ---------------- HASH PASSWORD BEFORE SAVE ---------------- */
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcryptjs.genSalt(10);
        this.password = await bcryptjs.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

/* ---------------- COMPARE PASSWORD ---------------- */
adminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcryptjs.compare(enteredPassword, this.password);
};

/* ---------------- EXPOSE SAFE JSON ---------------- */
adminSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

export default mongoose.model("Admin", adminSchema);