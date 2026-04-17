'use strict';
const router = require('express').Router();
const {
    processSale, getSales, getSaleById, getDailySummary, getChartData
} = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, processSale);
router.get('/', protect, getSales);
router.get('/report/summary', protect, authorize('admin'), getDailySummary);
router.get('/report/chart', protect, authorize('admin'), getChartData);
router.get('/:id', protect, getSaleById);

module.exports = router;
