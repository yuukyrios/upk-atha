// routes/mechs.js
const express = require('express');
const router = express.Router();
const mechController = require('../controllers/mechController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../utils/uploadUtils');

// Public routes
router.get('/search', mechController.searchMechs);
router.get('/:mechId', mechController.getMechById);

// Admin only routes
router.post('/', authenticate, requireAdmin, upload.single('mechImage'), mechController.createMech);
router.put('/:mechId', authenticate, requireAdmin, upload.single('mechImage'), mechController.updateMech);
router.delete('/:mechId', authenticate, requireAdmin, mechController.deleteMech);

module.exports = router;