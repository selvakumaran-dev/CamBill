'use strict';
/**
 * Seed script — clears ALL data and exits.
 * No mock/demo data is inserted.
 * Run: npm run seed
 *
 * After running, use the app's register page to create your
 * first admin account + store, then add cashiers from the admin panel.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const User = require('../models/User');
const Store = require('../models/Store');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅  Connected to MongoDB');

        // Drop all collections cleanly
        await Promise.all([
            Product.deleteMany({}),
            Sale.deleteMany({}),
            User.deleteMany({}),
            Store.deleteMany({}),
        ]);
        console.log('🗑️   All data cleared');
        console.log('');
        console.log('✅  Database is clean and ready.');
        console.log('👉  Open http://localhost:5173/register to create your first admin + store.');
    } catch (err) {
        console.error('❌  Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
