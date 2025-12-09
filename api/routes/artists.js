const express = require('express');
const db = require('../../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/artists
 * Purpose: Get all artists
 * Access: Unauthenticated
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM artists ORDER BY name');

    res.json({ artists: result.rows });
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/artists/:id
 * Purpose: Get artist details with their albums
 * Access: Unauthenticated
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const artistResult = await db.query('SELECT * FROM artists WHERE artist_id = $1', [id]);

    if (artistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const albumsResult = await db.query(
      'SELECT * FROM albums WHERE artist_id = $1 ORDER BY release_year DESC',
      [id]
    );

    res.json({
      artist: artistResult.rows[0],
      albums: albumsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/artists
 * Purpose: Create a new artist
 * Access: Admin only
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, bio, country, formedYear, imageUrl } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    const result = await db.query(
      'INSERT INTO artists (name, bio, country, formed_year, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING artist_id',
      [name, bio, country, formedYear, imageUrl]
    );

    res.status(201).json({
      artistId: result.rows[0].artist_id,
      message: 'Artist created successfully',
    });
  } catch (error) {
    console.error('Error creating artist:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/artists/:id
 * Purpose: Update artist information
 * Access: Admin only
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, country, formedYear, imageUrl } = req.body;

    const result = await db.query(
      `UPDATE artists 
       SET name = COALESCE($1, name),
           bio = COALESCE($2, bio),
           country = COALESCE($3, country),
           formed_year = COALESCE($4, formed_year),
           image_url = COALESCE($5, image_url)
       WHERE artist_id = $6
       RETURNING *`,
      [name, bio, country, formedYear, imageUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json({
      message: 'Artist updated successfully',
      artist: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating artist:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/artists/:id
 * Purpose: Delete an artist
 * Access: Admin only
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM artists WHERE artist_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json({ message: 'Artist deleted successfully' });
  } catch (error) {
    console.error('Error deleting artist:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
