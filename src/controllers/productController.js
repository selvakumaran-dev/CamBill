'use strict';
const Product = require('../models/Product');

/* All queries are automatically scoped to req.user.store */

const getProducts = async (req, res) => {
    const { category, q } = req.query;
    const filter = { store: req.user.store, isActive: true };
    if (category) filter.category = category;
    if (q) filter.name = { $regex: q, $options: 'i' };

    const products = await Product.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, count: products.length, data: products });
};

const getByBarcode = async (req, res) => {
    const product = await Product.findOne({
        store: req.user.store,
        barcode: req.params.barcode,
        isActive: true,
    }).lean();
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
};

const createProduct = async (req, res) => {
    // Force store to be the admin's store — never trust client for this
    const product = await Product.create({ ...req.body, store: req.user.store });
    res.status(201).json({ success: true, data: product });
};

const updateProduct = async (req, res) => {
    const product = await Product.findOneAndUpdate(
        { _id: req.params.id, store: req.user.store },
        { ...req.body, store: req.user.store },   // prevent store hijack
        { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found in your store' });
    res.json({ success: true, data: product });
};

const deleteProduct = async (req, res) => {
    const product = await Product.findOneAndUpdate(
        { _id: req.params.id, store: req.user.store },
        { isActive: false },
        { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found in your store' });
    res.json({ success: true, message: 'Product deactivated' });
};

module.exports = { getProducts, getByBarcode, createProduct, updateProduct, deleteProduct };
