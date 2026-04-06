// controllers/commentController.js
const pool = require('../config/database');

const commentController = {

    // Get comments for a mech
    getComments: async (req, res) => {
        try {
            const { mechId } = req.params;
            const { page = 1, limit = 20, sort = 'newest' } = req.query;
            const offset = (page - 1) * limit;

            let orderBy = 'c.created_at DESC';
            if (sort === 'top') {
                orderBy = '(c.upvotes - c.downvotes) DESC, c.created_at DESC';
            } else if (sort === 'controversial') {
                orderBy = '(c.upvotes + c.downvotes) DESC, c.created_at DESC';
            }

            const [comments] = await pool.execute(
                `SELECT c.comment_id, c.content, c.is_admin_comment,
                        c.upvotes, c.downvotes, c.created_at,
                        u.user_id, u.nickname, u.profile_picture_url, u.user_type,
                        (SELECT COUNT(*) FROM comment_replies 
                         WHERE parent_comment_id = c.comment_id 
                         AND is_deleted = FALSE) as reply_count
                 FROM comments c
                 JOIN users u ON c.user_id = u.user_id
                 WHERE c.mech_id = ? AND c.is_deleted = FALSE
                 ORDER BY ${orderBy}
                 LIMIT ? OFFSET ?`,
                [mechId, parseInt(limit), parseInt(offset)]
            );

            let userVotes = [];
            if (req.userId) {
                const commentIds = comments.map(c => c.comment_id);

                if (commentIds.length > 0) {
                    const [votes] = await pool.execute(
                        `SELECT comment_id, vote_type 
                         FROM comment_votes 
                         WHERE user_id = ? 
                         AND comment_id IN (${commentIds.join(',')})`,
                        [req.userId]
                    );
                    userVotes = votes;
                }
            }

            const commentsWithVote = comments.map(comment => ({
                ...comment,
                userVote: userVotes.find(v => v.comment_id === comment.comment_id)?.vote_type || null
            }));

            res.json({ comments: commentsWithVote });

        } catch (error) {
            console.error('Get comments error:', error);
            res.status(500).json({ message: 'Failed to get comments' });
        }
    },


    // Add comment
    addComment: async (req, res) => {
        try {
            const { mechId } = req.params;
            const { content } = req.body;

            if (!content || content.trim().length === 0) {
                return res.status(400).json({ message: 'Comment content is required' });
            }

            if (content.length > 2000) {
                return res.status(400).json({ message: 'Comment too long (max 2000 characters)' });
            }

            const [mech] = await pool.execute(
                'SELECT mech_id FROM mechs WHERE mech_id = ?',
                [mechId]
            );

            if (mech.length === 0) {
                return res.status(404).json({ message: 'Mech not found' });
            }

            const [result] = await pool.execute(
                'INSERT INTO comments (mech_id, user_id, content) VALUES (?, ?, ?)',
                [mechId, req.userId, content.trim()]
            );

            const [comments] = await pool.execute(
                `SELECT c.comment_id, c.content, c.is_admin_comment,
                        c.upvotes, c.downvotes, c.created_at,
                        u.user_id, u.nickname, u.profile_picture_url, u.user_type
                 FROM comments c
                 JOIN users u ON c.user_id = u.user_id
                 WHERE c.comment_id = ?`,
                [result.insertId]
            );

            res.status(201).json({
                message: 'Comment added successfully',
                comment: comments[0]
            });

        } catch (error) {
            console.error('Add comment error:', error);
            res.status(500).json({ message: 'Failed to add comment' });
        }
    },


    // Vote comment
    voteComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const { voteType } = req.body;

            if (!['upvote', 'downvote'].includes(voteType)) {
                return res.status(400).json({ message: 'Invalid vote type' });
            }

            const [comment] = await pool.execute(
                'SELECT comment_id FROM comments WHERE comment_id = ? AND is_deleted = FALSE',
                [commentId]
            );

            if (comment.length === 0) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            const [existingVote] = await pool.execute(
                'SELECT vote_id, vote_type FROM comment_votes WHERE comment_id = ? AND user_id = ?',
                [commentId, req.userId]
            );

            if (existingVote.length > 0) {

                if (existingVote[0].vote_type === voteType) {
                    await pool.execute(
                        'DELETE FROM comment_votes WHERE vote_id = ?',
                        [existingVote[0].vote_id]
                    );
                    return res.json({ message: 'Vote removed' });

                } else {
                    await pool.execute(
                        'UPDATE comment_votes SET vote_type = ? WHERE vote_id = ?',
                        [voteType, existingVote[0].vote_id]
                    );
                    return res.json({ message: 'Vote updated' });
                }
            }

            await pool.execute(
                'INSERT INTO comment_votes (comment_id, user_id, vote_type) VALUES (?, ?, ?)',
                [commentId, req.userId, voteType]
            );

            res.json({ message: 'Vote added' });

        } catch (error) {
            console.error('Vote comment error:', error);
            res.status(500).json({ message: 'Failed to vote' });
        }
    },


    // Delete comment
    deleteComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const { reason } = req.body;

            const [comment] = await pool.execute(
                'SELECT user_id FROM comments WHERE comment_id = ? AND is_deleted = FALSE',
                [commentId]
            );

            if (comment.length === 0) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            if (comment[0].user_id !== req.userId && req.userType !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to delete this comment' });
            }

            if (req.userType === 'admin') {
                await pool.execute(
                    'UPDATE comments SET is_deleted = TRUE, deleted_by = ?, deleted_reason = ? WHERE comment_id = ?',
                    [req.userId, reason || 'Moderation', commentId]
                );
            } else {
                await pool.execute(
                    'UPDATE comments SET is_deleted = TRUE WHERE comment_id = ?',
                    [commentId]
                );
            }

            res.json({ message: 'Comment deleted' });

        } catch (error) {
            console.error('Delete comment error:', error);
            res.status(500).json({ message: 'Failed to delete comment' });
        }
    },


    // Get replies
    getReplies: async (req, res) => {
        try {
            const { commentId } = req.params;

            const [replies] = await pool.execute(
                `SELECT r.reply_id, r.content, r.is_admin_reply, r.created_at,
                        u.user_id, u.nickname, u.profile_picture_url, u.user_type
                 FROM comment_replies r
                 JOIN users u ON r.user_id = u.user_id
                 WHERE r.parent_comment_id = ? AND r.is_deleted = FALSE
                 ORDER BY r.created_at ASC`,
                [commentId]
            );

            res.json({ replies });

        } catch (error) {
            console.error('Get replies error:', error);
            res.status(500).json({ message: 'Failed to get replies' });
        }
    },


    // Add reply (FIXED)
    addReply: async (req, res) => {
        try {
            const { commentId } = req.params;
            const { content } = req.body;

            if (!content || content.trim().length === 0) {
                return res.status(400).json({ message: 'Reply content is required' });
            }

            const [comment] = await pool.execute(
                'SELECT comment_id FROM comments WHERE comment_id = ? AND is_deleted = FALSE',
                [commentId]
            );

            if (comment.length === 0) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            const [result] = await pool.execute(
                'INSERT INTO comment_replies (parent_comment_id, user_id, content) VALUES (?, ?, ?)',
                [commentId, req.userId, content.trim()]
            );

            // FIXED JOIN (r.user_id instead of c.user_id)
            const [replies] = await pool.execute(
                `SELECT r.reply_id, r.content, r.is_admin_reply, r.created_at,
                        u.user_id, u.nickname, u.profile_picture_url, u.user_type
                 FROM comment_replies r
                 JOIN users u ON r.user_id = u.user_id
                 WHERE r.reply_id = ?`,
                [result.insertId]
            );

            res.status(201).json({
                message: 'Reply added',
                reply: replies[0]
            });

        } catch (error) {
            console.error('Add reply error:', error);
            res.status(500).json({ message: 'Failed to add reply' });
        }
    },


    // Delete reply
    deleteReply: async (req, res) => {
        try {
            const { replyId } = req.params;
            const { reason } = req.body;

            const [reply] = await pool.execute(
                'SELECT user_id FROM comment_replies WHERE reply_id = ? AND is_deleted = FALSE',
                [replyId]
            );

            if (reply.length === 0) {
                return res.status(404).json({ message: 'Reply not found' });
            }

            if (reply[0].user_id !== req.userId && req.userType !== 'admin') {
                return res.status(403).json({ message: 'Not authorized' });
            }

            if (req.userType === 'admin') {
                await pool.execute(
                    'UPDATE comment_replies SET is_deleted = TRUE, deleted_by = ?, deleted_reason = ? WHERE reply_id = ?',
                    [req.userId, reason || 'Moderation', replyId]
                );
            } else {
                await pool.execute(
                    'UPDATE comment_replies SET is_deleted = TRUE WHERE reply_id = ?',
                    [replyId]
                );
            }

            res.json({ message: 'Reply deleted' });

        } catch (error) {
            console.error('Delete reply error:', error);
            res.status(500).json({ message: 'Failed to delete reply' });
        }
    }
};

module.exports = commentController;