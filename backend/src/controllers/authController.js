// controllers/authController.js
const pool = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/jwtUtils');

const authController = {
    // Register new user
    register: async (req, res) => {
        try {
            const { nickname, password, email } = req.body;

            if (!nickname || !password) {
                return res.status(400).json({ message: 'Nickname and password are required' });
            }

            if (password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters' });
            }

            // Check if nickname exists
            const [existingUsers] = await pool.execute(
                'SELECT user_id FROM users WHERE nickname = ?',
                [nickname]
            );

            if (existingUsers.length > 0) {
                return res.status(409).json({ message: 'Nickname already taken' });
            }

            // Check email if provided
            if (email) {
                const [existingEmail] = await pool.execute(
                    'SELECT user_id FROM users WHERE email = ?',
                    [email]
                );
                if (existingEmail.length > 0) {
                    return res.status(409).json({ message: 'Email already registered' });
                }
            }

            const passwordHash = await hashPassword(password);

            const [result] = await pool.execute(
                'INSERT INTO users (nickname, password_hash, email) VALUES (?, ?, ?)',
                [nickname, passwordHash, email || null]
            );

            const token = generateToken(result.insertId, 'normal');

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    userId: result.insertId,
                    nickname,
                    userType: 'normal',
                    profilePicture: 'default_avatar.png'
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Registration failed' });
        }
    },

    // Login
    login: async (req, res) => {
        try {
            const { nickname, password } = req.body;

            if (!nickname || !password) {
                return res.status(400).json({ message: 'Nickname and password are required' });
            }

            const [users] = await pool.execute(
                'SELECT user_id, nickname, password_hash, user_type, profile_picture_url, is_active FROM users WHERE nickname = ?',
                [nickname]
            );

            if (users.length === 0) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const user = users[0];

            if (!user.is_active) {
                return res.status(401).json({ message: 'Account has been deactivated' });
            }

            const isValidPassword = await comparePassword(password, user.password_hash);

            if (!isValidPassword) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Update last login
            await pool.execute(
                'UPDATE users SET last_login = NOW() WHERE user_id = ?',
                [user.user_id]
            );

            const token = generateToken(user.user_id, user.user_type);

            res.json({
                message: 'Login successful',
                token,
                user: {
                    userId: user.user_id,
                    nickname: user.nickname,
                    userType: user.user_type,
                    profilePicture: user.profile_picture_url
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Login failed' });
        }
    },

    // Get current user profile
    getProfile: async (req, res) => {
        try {
            const [users] = await pool.execute(
                `SELECT u.user_id, u.nickname, u.email, u.profile_picture_url, 
                        u.user_type, u.created_at, u.last_login,
                        COUNT(DISTINCT c.comment_id) as comment_count
                 FROM users u
                 LEFT JOIN comments c ON u.user_id = c.user_id AND c.is_deleted = FALSE
                 WHERE u.user_id = ? AND u.is_active = TRUE
                 GROUP BY u.user_id`,
                [req.userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({ user: users[0] });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ message: 'Failed to get profile' });
        }
    },

    // Update profile picture
    updateProfilePicture: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No image uploaded' });
            }

            const imageUrl = `/uploads/${req.file.filename}`;

            await pool.execute(
                'UPDATE users SET profile_picture_url = ? WHERE user_id = ?',
                [imageUrl, req.userId]
            );

            res.json({
                message: 'Profile picture updated',
                profilePicture: imageUrl
            });
        } catch (error) {
            console.error('Update profile picture error:', error);
            res.status(500).json({ message: 'Failed to update profile picture' });
        }
    },

    // Delete own account
    deleteAccount: async (req, res) => {
        try {
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({ message: 'Password required to delete account' });
            }

            const [users] = await pool.execute(
                'SELECT password_hash FROM users WHERE user_id = ?',
                [req.userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const isValidPassword = await comparePassword(password, users[0].password_hash);

            if (!isValidPassword) {
                return res.status(401).json({ message: 'Invalid password' });
            }

            // Soft delete - set is_active to false
            await pool.execute(
                'UPDATE users SET is_active = FALSE, nickname = CONCAT(nickname, "_deleted_", UNIX_TIMESTAMP()) WHERE user_id = ?',
                [req.userId]
            );

            res.json({ message: 'Account deleted successfully' });
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({ message: 'Failed to delete account' });
        }
    }
};

module.exports = authController;