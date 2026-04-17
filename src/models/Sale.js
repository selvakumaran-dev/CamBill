'use strict';
const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        barcode: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        taxRate: { type: Number, default: 0 },
        lineTotal: { type: Number, required: true },
    },
    { _id: false }
);

const saleSchema = new mongoose.Schema(
    {
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        invoiceNumber: {
            type: String,
            unique: true,
            default: () => `INV-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`,
        },
        cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        items: { type: [saleItemSchema], required: true },
        subtotal: { type: Number, required: true },
        taxTotal: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true },
        paymentMode: { type: String, enum: ['cash', 'card', 'upi', 'other'], default: 'cash' },
        amountPaid: { type: Number },
        change: { type: Number, default: 0 },
        status: { type: String, enum: ['completed', 'voided', 'refunded'], default: 'completed' },
        note: { type: String, default: '' },
        offlineId: { type: String, sparse: true },
    },
    { timestamps: true, versionKey: false }
);

saleSchema.index({ store: 1, createdAt: -1 });
saleSchema.index({ store: 1, cashier: 1, createdAt: -1 });
saleSchema.index({ store: 1, offlineId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Sale', saleSchema);
