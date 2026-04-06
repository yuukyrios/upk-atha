// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const upload = require('../utils/uploadUtils');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile/picture', authenticate, upload.single('profilePicture'), authController.updateProfilePicture);
router.delete('/account', authenticate, authController.deleteAccount);

module.exports = router ;