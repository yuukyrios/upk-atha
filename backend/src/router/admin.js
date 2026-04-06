// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/type', adminController.updateUserType);
router.put('/users/:userId/status', adminController.toggleUserStatus);
router.get('/moderation', adminController.getModerationQueue);

module.exports = router;