// controllers/adminController.js
const pool = require('../config/database');

const adminController = {
    // Get dashboard stats
    getStats: async (req, res) => {
        try {
            const [[userStats]] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN user_type = 'admin' THEN 1 ELSE 0 END) as admin_count,
                    SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_users_today
                 FROM users WHERE is_active = TRUE`
            );

            const [[contentStats]] = await pool.execute(
                `SELECT 
                    (SELECT COUNT(*) FROM series) as total_series,
                    (SELECT COUNT(*) FROM mechs) as total_mechs,
                    (SELECT COUNT(*) FROM comments WHERE is_deleted = FALSE) as total_comments`
            );

            const [[recentActivity]] = await pool.execute(
                `SELECT 
                    (SELECT COUNT(*) FROM comments WHERE is_deleted = FALSE AND DATE(created_at) = CURDATE()) as comments_today,
                    (SELECT COUNT(*) FROM mechs WHERE DATE(created_at) = CURDATE()) as mechs_added_today`
            );

            res.json({
                users: userStats,
                content: contentStats,
                activity: recentActivity
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ message: 'Failed to get stats' });
        }
    },

    // Get all users (admin only)
    getAllUsers: async (req, res) => {
        try {
            const { page = 1, limit = 20, search } = req.query;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT user_id, nickname, email, user_type, profile_picture_url, 
                       created_at, last_login, is_active
                FROM users WHERE 1=1
            `;
            const params = [];

            if (search) {
                sql += ` AND (nickname LIKE ? OR email LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`);
            }

            sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const [users] = await pool.execute(sql, params);

            res.json({ users });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ message: 'Failed to get users' });
        }
    },

    // Promote/demote user (admin only)
    updateUserType: async (req, res) => {
        try {
            const { userId } = req.params;
            const { userType } = req.body;

            if (!['normal', 'admin'].includes(userType)) {
                return res.status(400).json({ message: 'Invalid user type' });
            }

            if (parseInt(userId) === req.userId) {
                return res.status(400).json({ message: 'Cannot change your own role' });
            }

            await pool.execute(
                'UPDATE users SET user_type = ? WHERE user_id = ?',
                [userType, userId]
            );

            res.json({ message: 'User role updated' });
        } catch (error) {
            console.error('Update user type error:', error);
            res.status(500).json({ message: 'Failed to update user' });
        }
    },

    // Ban/unban user (admin only)
    toggleUserStatus: async (req, res) => {
        try {
            const { userId } = req.params;

            if (parseInt(userId) === req.userId) {
                return res.status(400).json({ message: 'Cannot ban yourself' });
            }

            const [user] = await pool.execute(
                'SELECT is_active FROM users WHERE user_id = ?',
                [userId]
            );

            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const newStatus = !user[0].is_active;
            await pool.execute(
                'UPDATE users SET is_active = ? WHERE user_id = ?',
                [newStatus, userId]
            );

            res.json({ 
                message: `User ${newStatus ? 'activated' : 'banned'}`,
                isActive: newStatus
            });
        } catch (error) {
            console.error('Toggle user status error:', error);
            res.status(500).json({ message: 'Failed to update user status' });
        }
    },

    // Get reported comments (for moderation)
    getModerationQueue: async (req, res) => {
        try {
            // Get recently deleted comments and their reasons
            const [deletedComments] = await pool.execute(
                `SELECT c.comment_id, c.content, c.deleted_reason, c.deleted_at,
                        u.nickname as author, a.nickname as deleted_by_name
                 FROM comments c
                 JOIN users u ON c.user_id = u.user_id
                 JOIN users a ON c.deleted_by = a.user_id
                 WHERE c.is_deleted = TRUE
                 ORDER BY c.deleted_at DESC
                 LIMIT 50`
            );

            res.json({ deletedComments });
        } catch (error) {
            console.error('Get moderation queue error:', error);
            res.status(500).json({ message: 'Failed to get moderation queue' });
        }
    }
};

module.exports = adminController;