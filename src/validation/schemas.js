import z from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});

export const productSchema = z.object({
    name: z.string().min(3, 'Product name required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be positive'),
    category: z.string().min(2, 'Category required'),
    image: z.string().url().optional().nullable(),
    stock: z.number().min(0, 'Stock cannot be negative').optional(),
    specifications: z.record(z.string()).optional()
});

export const reviewSchema = z.object({
    rating: z.number().min(1, 'Rating must be between 1-5').max(5),
    title: z.string().min(5, 'Title must be at least 5 characters').max(100),
    comment: z.string().min(10, 'Review must be at least 10 characters').max(1000)
});

export const cartItemSchema = z.object({
    productId: z.string().min(1),
    quantity: z.number().min(1, 'Quantity must be at least 1')
});

export const orderSchema = z.object({
    paymentMethod: z.enum(['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet']),
    shippingAddress: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
        street: z.string(),
        city: z.string(),
        state: z.string(),
        pincode: z.string(),
        country: z.string()
    })
});

export const validateData = (schema, data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        throw new Error(errors.join(', '));
    }
    return result.data;
};
