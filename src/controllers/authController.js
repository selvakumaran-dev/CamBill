'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Store = require('../models/Store');

const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

const userPayload = (user, store) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    store: { id: store._id, name: store.name },
});

/* ─────────────────────────────────────────────────────────────────
   POST /api/auth/register
   Admin-only self-registration — creates a new Store + Admin user
   Body: { name, email, password, storeName, storeAddress?, storePhone? }
───────────────────────────────────────────────────────────────── */
const register = async (req, res) => {
    const { name, email, password, storeName, storeAddress = '', storePhone = '' } = req.body;

    if (!name || !email || !password || !storeName) {
        return res.status(400).json({ success: false, message: 'Name, email, password and store name are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Create the store first
    const store = await Store.create({ name: storeName, address: storeAddress, phone: storePhone });

    // Create the admin user linked to the store
    const user = await User.create({ name, email, password, role: 'admin', store: store._id });

    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user: userPayload(user, store) });
};

/* ─────────────────────────────────────────────────────────────────
   POST /api/auth/login
   Body: { email, password }
───────────────────────────────────────────────────────────────── */
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password').populate('store', 'name address phone isActive');
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated. Contact your admin.' });
    }
    if (!user.store?.isActive) {
        return res.status(403).json({ success: false, message: 'Store is deactivated. Contact support.' });
    }

    const token = signToken(user._id);
    res.json({ success: true, token, user: userPayload(user, user.store) });
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/auth/me
───────────────────────────────────────────────────────────────── */
const getMe = async (req, res) => {
    const user = await User.findById(req.user._id).populate('store', 'name address phone');
    res.json({ success: true, user: userPayload(user, user.store) });
};

/* ─────────────────────────────────────────────────────────────────
   POST /api/auth/cashiers    (admin only)
   Admin creates a cashier account for THEIR store
   Body: { name, email, password }
───────────────────────────────────────────────────────────────── */
const createCashier = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const cashier = await User.create({
        name,
        email,
        password,
        role: 'cashier',
        store: req.user.store,   // same store as the admin
    });

    res.status(201).json({
        success: true,
        data: { id: cashier._id, name: cashier.name, email: cashier.email, role: cashier.role },
    });
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/auth/cashiers    (admin only)
   List all cashiers in admin's store
───────────────────────────────────────────────────────────────── */
const getCashiers = async (req, res) => {
    const cashiers = await User.find({ store: req.user.store, role: 'cashier' })
        .select('name email isActive createdAt')
        .sort({ createdAt: -1 })
        .lean();
    res.json({ success: true, data: cashiers });
};

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/auth/cashiers/:id/toggle    (admin only)
   Activate / deactivate a cashier
───────────────────────────────────────────────────────────────── */
const toggleCashier = async (req, res) => {
    const cashier = await User.findOne({ _id: req.params.id, store: req.user.store, role: 'cashier' });
    if (!cashier) return res.status(404).json({ success: false, message: 'Cashier not found in your store' });
    cashier.isActive = !cashier.isActive;
    await cashier.save();
    res.json({ success: true, data: { id: cashier._id, isActive: cashier.isActive } });
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/auth/store    (admin only)
   Get own store details
───────────────────────────────────────────────────────────────── */
const getStore = async (req, res) => {
    const store = await Store.findById(req.user.store);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, data: store });
};

/* ─────────────────────────────────────────────────────────────────
   PUT /api/auth/store    (admin only)
   Update own store details
───────────────────────────────────────────────────────────────── */
const updateStore = async (req, res) => {
    const { name, address, phone } = req.body;
    const store = await Store.findByIdAndUpdate(
        req.user.store,
        { name, address, phone },
        { new: true, runValidators: true }
    );
    res.json({ success: true, data: store });
};

module.exports = { register, login, getMe, createCashier, getCashiers, toggleCashier, getStore, updateStore };
