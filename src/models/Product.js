'use strict';
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        barcode: {
            type: String,
            required: [true, 'Barcode is required'],
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        stock: {
            type: Number,
            required: true,
            min: [0, 'Stock cannot be negative'],
            default: 0,
        },
        category: {
            type: String,
            enum: ['Dairy', 'Bakery', 'Beverages', 'Snacks', 'Produce', 'Meat', 'Frozen', 'Household', 'Personal Care', 'Other'],
            default: 'Other',
        },
        unit: { type: String, default: 'pcs' },
        taxRate: { type: Number, default: 0, min: 0, max: 100 },
        imageUrl: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false }
);

// Barcode must be unique within a store (two stores CAN sell the same barcode)
productSchema.index({ store: 1, barcode: 1 }, { unique: true });
productSchema.index({ store: 1, category: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
