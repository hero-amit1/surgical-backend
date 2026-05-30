import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import Admin from './src/models/Admin.js';
import Product from './src/models/Product.js';
import User from './src/models/User.js';

dotenv.config();

const seedDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            console.error('Missing MONGODB_URI in .env');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Clear old data
        await Admin.deleteMany({});
        await Product.deleteMany({});
        await User.deleteMany({});
        console.log('🗑️ Cleared existing data');

        // Create admin (password will be hashed by the Admin model pre-save hook)
        const admin = await Admin.create({
            email: 'admin@test.com',
            password: 'Admin@123',
            name: 'Test Admin',
            role: 'admin'
        });

        console.log('✅ Admin created');
        console.log('   Email: admin@test.com');
        console.log('   Password: Admin@123');

        // Create user (password will be hashed by the User model pre-save hook)
        const user = await User.create({
            email: 'user@test.com',
            password: 'User@123',
            name: 'Test User',
            phone: '9876543210'
        });

        console.log('\n✅ User created');
        console.log('   Email: user@test.com');
        console.log('   Password: User@123');

        // Products
        const products = [
            {
                name: 'Surgical Mask',
                description: 'High-quality surgical masks with 3-ply protection',
                category: 'PPE',
                price: 49,
                stock: 100,
                image: 'https://via.placeholder.com/300?text=Surgical+Mask',
                sku: 'MASK-001',
                featured: true
            },
            {
                name: 'Latex Gloves',
                description: 'Sterile latex examination gloves',
                category: 'Gloves',
                price: 199,
                stock: 50,
                image: 'https://via.placeholder.com/300?text=Latex+Gloves',
                sku: 'GLOVE-001',
                featured: true
            },
            {
                name: 'Hand Sanitizer',
                description: '70% alcohol-based hand sanitizer',
                category: 'Sanitizers',
                price: 299,
                stock: 75,
                image: 'https://via.placeholder.com/300?text=Hand+Sanitizer',
                sku: 'SANIT-001',
                trending: true
            },
            {
                name: 'Thermometer',
                description: 'Digital infrared thermometer',
                category: 'Equipment',
                price: 899,
                stock: 30,
                image: 'https://via.placeholder.com/300?text=Thermometer',
                sku: 'THERM-001'
            },
            {
                name: 'Stethoscope',
                description: 'Professional dual-head stethoscope',
                category: 'Equipment',
                price: 1999,
                stock: 20,
                image: 'https://via.placeholder.com/300?text=Stethoscope',
                sku: 'STETH-001',
                featured: true
            }
        ];

        await Product.insertMany(products);
        console.log(`\n✅ Created ${products.length} products`);

        console.log('\n🎉 Seeding completed successfully!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedDatabase();