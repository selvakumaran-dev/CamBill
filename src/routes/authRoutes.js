'use strict';
const router = require('express').Router();
const {
    register, login, getMe,
    createCashier, getCashiers, toggleCashier,
    getStore, updateStore,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public
router.post('/register', register);
router.post('/login', login);

// Any authenticated user
router.get('/me', protect, getMe);

// Admin-only — cashier & store management
router.post('/cashiers', protect, authorize('admin'), createCashier);
router.get('/cashiers', protect, authorize('admin'), getCashiers);
router.patch('/cashiers/:id/toggle', protect, authorize('admin'), toggleCashier);
router.get('/store', protect, authorize('admin'), getStore);
router.put('/store', protect, authorize('admin'), updateStore);

module.exports = router;
