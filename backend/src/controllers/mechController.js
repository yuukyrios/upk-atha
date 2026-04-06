// controllers/mechController.js
const pool = require('../config/database');

const mechController = {
    // Search mechs
    searchMechs: async (req, res) => {
        try {
            const { query, seriesId, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT m.mech_id, m.mech_name, m.model_number, m.classification,
                       m.height, m.image_url, m.created_at,
                       s.series_name, s.series_id
                FROM mechs m
                JOIN series s ON m.series_id = s.series_id
                WHERE 1=1
            `;
            const params = [];

            if (query) {
                sql += ` AND (m.mech_name LIKE ? OR m.model_number LIKE ? OR m.classification LIKE ?)`;
                const searchTerm = `%${query}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (seriesId) {
                sql += ` AND m.series_id = ?`;
                params.push(seriesId);
            }

            sql += ` ORDER BY m.mech_name LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const [mechs] = await pool.execute(sql, params);

            // Get total count for pagination
            let countSql = `SELECT COUNT(*) as total FROM mechs m WHERE 1=1`;
            const countParams = [];
            
            if (query) {
                countSql += ` AND (m.mech_name LIKE ? OR m.model_number LIKE ?)`;
                const searchTerm = `%${query}%`;
                countParams.push(searchTerm, searchTerm);
            }
            if (seriesId) {
                countSql += ` AND m.series_id = ?`;
                countParams.push(seriesId);
            }

            const [countResult] = await pool.execute(countSql, countParams);
            const total = countResult[0].total;

            res.json({
                mechs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Search mechs error:', error);
            res.status(500).json({ message: 'Failed to search mechs' });
        }
    },

    // Get single mech with full details
    getMechById: async (req, res) => {
        try {
            const { mechId } = req.params;

            const [mechs] = await pool.execute(
                `SELECT m.*, s.series_name, u.nickname as created_by_name
                 FROM mechs m
                 JOIN series s ON m.series_id = s.series_id
                 JOIN users u ON m.created_by = u.user_id
                 WHERE m.mech_id = ?`,
                [mechId]
            );

            if (mechs.length === 0) {
                return res.status(404).json({ message: 'Mech not found' });
            }

            res.json({ mech: mechs[0] });
        } catch (error) {
            console.error('Get mech error:', error);
            res.status(500).json({ message: 'Failed to get mech' });
        }
    },

    // Create new mech (admin only)
    createMech: async (req, res) => {
        try {
            const {
                mechName, seriesId, loreDescription, height, weight,
                armament, armorMaterial, powerSource, maxSpeed,
                manufacturer, pilot, modelNumber, classification,
                designFeatures
            } = req.body;

            if (!mechName || !seriesId || !loreDescription) {
                return res.status(400).json({ 
                    message: 'Mech name, series, and lore description are required' 
                });
            }

            // Verify series exists
            const [series] = await pool.execute(
                'SELECT series_id FROM series WHERE series_id = ?',
                [seriesId]
            );

            if (series.length === 0) {
                return res.status(404).json({ message: 'Series not found' });
            }

            const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

            const [result] = await pool.execute(
                `INSERT INTO mechs (
                    mech_name, series_id, lore_description, height, weight,
                    armament, armor_material, power_source, max_speed,
                    manufacturer, pilot, model_number, classification,
                    design_features, image_url, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    mechName, seriesId, loreDescription, height || null, weight || null,
                    armament || null, armorMaterial || null, powerSource || null, maxSpeed || null,
                    manufacturer || null, pilot || null, modelNumber || null, classification || null,
                    designFeatures || null, imageUrl, req.userId
                ]
            );

            res.status(201).json({
                message: 'Mech created successfully',
                mechId: result.insertId
            });
        } catch (error) {
            console.error('Create mech error:', error);
            res.status(500).json({ message: 'Failed to create mech' });
        }
    },

    // Update mech (admin only)
    updateMech: async (req, res) => {
        try {
            const { mechId } = req.params;
            const updateFields = req.body;

            const [existing] = await pool.execute(
                'SELECT mech_id FROM mechs WHERE mech_id = ?',
                [mechId]
            );

            if (existing.length === 0) {
                return res.status(404).json({ message: 'Mech not found' });
            }

            const allowedFields = [
                'mechName', 'seriesId', 'loreDescription', 'height', 'weight',
                'armament', 'armorMaterial', 'powerSource', 'maxSpeed',
                'manufacturer', 'pilot', 'modelNumber', 'classification',
                'designFeatures'
            ];

            const updates = [];
            const values = [];

            for (const [key, value] of Object.entries(updateFields)) {
                if (allowedFields.includes(key) && value !== undefined) {
                    // Convert camelCase to snake_case
                    const dbField = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                    updates.push(`${dbField} = ?`);
                    values.push(value);
                }
            }

            if (req.file) {
                updates.push('image_url = ?');
                values.push(`/uploads/${req.file.filename}`);
            }

            if (updates.length === 0) {
                return res.status(400).json({ message: 'No valid fields to update' });
            }

            const sql = `UPDATE mechs SET ${updates.join(', ')} WHERE mech_id = ?`;
            values.push(mechId);

            await pool.execute(sql, values);

            res.json({ message: 'Mech updated successfully' });
        } catch (error) {
            console.error('Update mech error:', error);
            res.status(500).json({ message: 'Failed to update mech' });
        }
    },

    // Delete mech (admin only)
    deleteMech: async (req, res) => {
        try {
            const { mechId } = req.params;

            const [existing] = await pool.execute(
                'SELECT mech_id FROM mechs WHERE mech_id = ?',
                [mechId]
            );

            if (existing.length === 0) {
                return res.status(404).json({ message: 'Mech not found' });
            }

            await pool.execute('DELETE FROM mechs WHERE mech_id = ?', [mechId]);

            res.json({ message: 'Mech deleted successfully' });
        } catch (error) {
            console.error('Delete mech error:', error);
            res.status(500).json({ message: 'Failed to delete mech' });
        }
    }
};

module.exports = mechController;