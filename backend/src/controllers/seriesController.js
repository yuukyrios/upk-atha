// controllers/seriesController.js
const pool = require('../config/database');

const seriesController = {
    // Get all series
    getAllSeries: async (req, res) => {
        try {
            const [series] = await pool.execute(
                `SELECT s.series_id, s.series_name, s.description, s.release_year, 
                        s.cover_image_url, s.created_at,
                        u.nickname as created_by_name,
                        COUNT(DISTINCT m.mech_id) as mech_count
                 FROM series s
                 JOIN users u ON s.created_by = u.user_id
                 LEFT JOIN mechs m ON s.series_id = m.series_id
                 GROUP BY s.series_id
                 ORDER BY s.series_name`
            );

            res.json({ series });
        } catch (error) {
            console.error('Get all series error:', error);
            res.status(500).json({ message: 'Failed to get series' });
        }
    },

    // Get single series with mechs
    getSeriesById: async (req, res) => {
        try {
            const { seriesId } = req.params;

            const [series] = await pool.execute(
                `SELECT s.series_id, s.series_name, s.description, s.release_year,
                        s.cover_image_url, s.created_at,
                        u.nickname as created_by_name
                 FROM series s
                 JOIN users u ON s.created_by = u.user_id
                 WHERE s.series_id = ?`,
                [seriesId]
            );

            if (series.length === 0) {
                return res.status(404).json({ message: 'Series not found' });
            }

            const [mechs] = await pool.execute(
                `SELECT mech_id, mech_name, model_number, classification, 
                        height, image_url
                 FROM mechs
                 WHERE series_id = ?
                 ORDER BY mech_name`,
                [seriesId]
            );

            res.json({
                series: series[0],
                mechs
            });
        } catch (error) {
            console.error('Get series error:', error);
            res.status(500).json({ message: 'Failed to get series' });
        }
    },

    // Create new series (admin only)
    createSeries: async (req, res) => {
        try {
            const { seriesName, description, releaseYear } = req.body;

            if (!seriesName) {
                return res.status(400).json({ message: 'Series name is required' });
            }

            // Check if series exists
            const [existing] = await pool.execute(
                'SELECT series_id FROM series WHERE series_name = ?',
                [seriesName]
            );

            if (existing.length > 0) {
                return res.status(409).json({ message: 'Series already exists' });
            }

            const coverImage = req.file ? `/uploads/${req.file.filename}` : null;

            const [result] = await pool.execute(
                'INSERT INTO series (series_name, description, release_year, created_by, cover_image_url) VALUES (?, ?, ?, ?, ?)',
                [seriesName, description || null, releaseYear || null, req.userId, coverImage]
            );

            res.status(201).json({
                message: 'Series created successfully',
                seriesId: result.insertId
            });
        } catch (error) {
            console.error('Create series error:', error);
            res.status(500).json({ message: 'Failed to create series' });
        }
    },

    // Update series (admin only)
    updateSeries: async (req, res) => {
        try {
            const { seriesId } = req.params;
            const { seriesName, description, releaseYear } = req.body;

            const [existing] = await pool.execute(
                'SELECT series_id FROM series WHERE series_id = ?',
                [seriesId]
            );

            if (existing.length === 0) {
                return res.status(404).json({ message: 'Series not found' });
            }

            let updateQuery = 'UPDATE series SET ';
            const updates = [];
            const values = [];

            if (seriesName) {
                updates.push('series_name = ?');
                values.push(seriesName);
            }
            if (description !== undefined) {
                updates.push('description = ?');
                values.push(description);
            }
            if (releaseYear) {
                updates.push('release_year = ?');
                values.push(releaseYear);
            }
            if (req.file) {
                updates.push('cover_image_url = ?');
                values.push(`/uploads/${req.file.filename}`);
            }

            if (updates.length === 0) {
                return res.status(400).json({ message: 'No fields to update' });
            }

            updateQuery += updates.join(', ') + ' WHERE series_id = ?';
            values.push(seriesId);

            await pool.execute(updateQuery, values);

            res.json({ message: 'Series updated successfully' });
        } catch (error) {
            console.error('Update series error:', error);
            res.status(500).json({ message: 'Failed to update series' });
        }
    },

    // Delete series (admin only)
    deleteSeries: async (req, res) => {
        try {
            const { seriesId } = req.params;

            const [existing] = await pool.execute(
                'SELECT series_id FROM series WHERE series_id = ?',
                [seriesId]
            );

            if (existing.length === 0) {
                return res.status(404).json({ message: 'Series not found' });
            }

            await pool.execute('DELETE FROM series WHERE series_id = ?', [seriesId]);

            res.json({ message: 'Series deleted successfully' });
        } catch (error) {
            console.error('Delete series error:', error);
            res.status(500).json({ message: 'Failed to delete series' });
        }
    }
};

module.exports = seriesController;