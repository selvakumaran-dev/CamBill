'use strict';
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Sale = require('../models/Sale');

/* All queries are automatically scoped to req.user.store */

const processSale = async (req, res) => {
    const { items, paymentMode = 'cash', amountPaid = 0, discount = 0, note = '', offlineId } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (offlineId) {
        const existing = await Sale.findOne({ store: req.user.store, offlineId });
        if (existing) return res.status(200).json({ success: true, data: existing, duplicated: true });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const enrichedItems = [];
        let subtotal = 0;
        let taxTotal = 0;

        for (const item of items) {
            const { barcode, quantity } = item;
            if (!barcode || !quantity || quantity < 1) {
                throw Object.assign(new Error('Invalid item: barcode and quantity > 0 required'), { statusCode: 400 });
            }

            // Lock + scope to this store — prevents cross-store stock manipulation
            const product = await Product.findOne({
                barcode,
                store: req.user.store,
                isActive: true,
            }).session(session);

            if (!product) {
                throw Object.assign(new Error(`Product not found in your store: ${barcode}`), { statusCode: 404 });
            }

            // High concurrency mathematical atomic lock
            const updateResult = await Product.updateOne(
                { _id: product._id, stock: { $gte: quantity } },
                { $inc: { stock: -quantity } },
                { session }
            );

            if (updateResult.modifiedCount === 0) {
                 throw Object.assign(
                    new Error(`Concurrency Error: Insufficient stock for "${product.name}" (available: ${product.stock})`),
                    { statusCode: 409 }
                );
            }

            const lineTotal = product.price * quantity;
            const lineTax = lineTotal * (product.taxRate / 100);
            subtotal += lineTotal;
            taxTotal += lineTax;

            enrichedItems.push({
                product: product._id,
                barcode: product.barcode,
                name: product.name,
                price: product.price,
                quantity,
                taxRate: product.taxRate,
                lineTotal,
            });
        }

        const grandTotal = subtotal + taxTotal - discount;
        const change = Math.max(0, amountPaid - grandTotal);

        const [sale] = await Sale.create(
            [{
                store: req.user.store, cashier: req.user._id, items: enrichedItems,
                subtotal, taxTotal, discount, grandTotal, paymentMode, amountPaid, change, note, offlineId
            }],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        const populated = await Sale.findById(sale._id).populate('cashier', 'name email').lean();
        res.status(201).json({ success: true, data: populated });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};

const getSales = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Admin sees all store sales; cashier sees only their own
    const filter = req.user.role === 'admin'
        ? { store: req.user.store }
        : { store: req.user.store, cashier: req.user._id };

    const [sales, total] = await Promise.all([
        Sale.find(filter).populate('cashier', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Sale.countDocuments(filter),
    ]);

    res.json({
        success: true,
        data: sales,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
};

const getSaleById = async (req, res) => {
    const sale = await Sale.findOne({ _id: req.params.id, store: req.user.store })
        .populate('cashier', 'name email')
        .lean();
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, data: sale });
};

const getDailySummary = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Sale.aggregate([
        { $match: { store: new mongoose.Types.ObjectId(req.user.store), createdAt: { $gte: today }, status: 'completed' } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$grandTotal' },
                totalTax: { $sum: '$taxTotal' },
                totalSales: { $count: {} },
                avgBasket: { $avg: '$grandTotal' },
            }
        },
    ]);

    res.json({
        success: true,
        data: result[0] || { totalRevenue: 0, totalTax: 0, totalSales: 0, avgBasket: 0 },
    });
};

const getChartData = async (req, res) => {
    const storeId = new mongoose.Types.ObjectId(req.user.store);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Daily Revenue (last 7 days)
    const dailyRevenue = await Sale.aggregate([
        { $match: { store: storeId, createdAt: { $gte: sevenDaysAgo }, status: 'completed' } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                revenue: { $sum: "$grandTotal" }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    // 2. Category Breakdown (from items in completed sales)
    const categoryData = await Sale.aggregate([
        { $match: { store: storeId, status: 'completed' } },
        { $unwind: "$items" },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'productDoc'
            }
        },
        { $unwind: "$productDoc" },
        {
            $group: {
                _id: "$productDoc.category",
                value: { $sum: "$items.lineTotal" }
            }
        },
    ]);

    const formattedRevenue = dailyRevenue.map(d => ({ date: d._id, revenue: d.revenue }));
    const formattedCategory = categoryData.map(c => ({ name: c._id || 'Other', value: c.value }));

    res.json({
        success: true,
        data: { revenueData: formattedRevenue, categoryData: formattedCategory }
    });
};

module.exports = { processSale, getSales, getSaleById, getDailySummary, getChartData };
