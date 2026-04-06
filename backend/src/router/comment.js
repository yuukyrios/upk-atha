// routes/comments.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

// Public routes (with optional auth for vote status)
router.get('/mech/:mechId', authenticate, commentController.getComments);
router.get('/:commentId/replies', commentController.getReplies);

// Protected routes
router.post('/mech/:mechId', authenticate, commentController.addComment);
router.post('/:commentId/vote', authenticate, commentController.voteComment);
router.delete('/:commentId', authenticate, commentController.deleteComment);
router.post('/:commentId/replies', authenticate, commentController.addReply);
router.delete('/replies/:replyId', authenticate, commentController.deleteReply);

module.exports = router;