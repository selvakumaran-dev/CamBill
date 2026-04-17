'use strict';
const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Store name is required'], trim: true },
        address: { type: String, default: '', trim: true },
        phone: { type: String, default: '', trim: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Store', storeSchema);
