// middleware/auth.js
const { verifyToken } = require('../utils/jwtUtils');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = verifyToken(token);
        req.userId = decoded.userId;
        req.userType = decoded.userType;
        
        // Verify user still exists and is active
        const [users] = await pool.execute(
            'SELECT user_id, user_type, is_active FROM users WHERE user_id = ?',
            [decoded.userId]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({ message: 'User not found or inactive' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.userType !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

module.exports = {
    authenticate,
    requireAdmin
};