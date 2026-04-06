// routes/series.js
const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/seriesController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../utils/uploadUtils');

// Public routes
router.get('/', seriesController.getAllSeries);
router.get('/:seriesId', seriesController.getSeriesById);

// Admin only routes
router.post('/', authenticate, requireAdmin, upload.single('coverImage'), seriesController.createSeries);
router.put('/:seriesId', authenticate, requireAdmin, upload.single('coverImage'), seriesController.updateSeries);
router.delete('/:seriesId', authenticate, requireAdmin, seriesController.deleteSeries);

module.exports = router;