const express = require('express');
const db = require('../../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/albums
 * Purpose: Retrieve all albums with pagination and filtering
 * Access: Unauthenticated
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, genre, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, ar.name as artist_name,
             COALESCE(AVG(r.rating), 0)::float as avg_rating,
             COUNT(r.review_id)::int as review_count
      FROM albums a
      JOIN artists ar ON a.artist_id = ar.artist_id
      LEFT JOIN reviews r ON a.album_id = r.album_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (genre) {
      paramCount++;
      query += ` AND a.genre ILIKE $${paramCount}`;
      params.push(`%${genre}%`);
    }

    if (search) {
      paramCount++;
      query += ` AND (a.title ILIKE $${paramCount} OR ar.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY a.album_id, ar.artist_id, ar.name`;
    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM albums a JOIN artists ar ON a.artist_id = ar.artist_id WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (genre) {
      countParamCount++;
      countQuery += ` AND a.genre ILIKE $${countParamCount}`;
      countParams.push(`%${genre}%`);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (a.title ILIKE $${countParamCount} OR ar.name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      albums: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/albums/top
 * Purpose: Get the top 4 rated albums
 * Access: Unauthenticated
 */
router.get('/top', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, ar.name as artist_name, 
              COALESCE(AVG(r.rating), 0)::float as avg_rating,
              COUNT(r.review_id)::int as review_count
       FROM albums a
       JOIN artists ar ON a.artist_id = ar.artist_id
       LEFT JOIN reviews r ON a.album_id = r.album_id
       GROUP BY a.album_id, ar.artist_id, ar.name
       HAVING COUNT(r.review_id) > 0
       ORDER BY avg_rating DESC, COUNT(r.review_id) DESC
       LIMIT 4`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching top albums:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/albums/:id
 * Purpose: Get detailed information about a specific album
 * Access: Unauthenticated
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get album with artist info
    const albumResult = await db.query(
      `SELECT a.*, ar.name as artist_name, ar.bio as artist_bio, ar.country, ar.formed_year
       FROM albums a
       JOIN artists ar ON a.artist_id = ar.artist_id
       WHERE a.album_id = $1`,
      [id]
    );

    if (albumResult.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Get tracks for the album
    const tracksResult = await db.query(
      'SELECT * FROM tracks WHERE album_id = $1 ORDER BY track_number',
      [id]
    );

    // Get average rating
    const ratingResult = await db.query(
      'SELECT AVG(rating)::numeric(10,2) as avg_rating, COUNT(*) as review_count FROM reviews WHERE album_id = $1',
      [id]
    );

    res.json({
      album: albumResult.rows[0],
      tracks: tracksResult.rows,
      averageRating: parseFloat(ratingResult.rows[0].avg_rating) || 0,
      reviewCount: parseInt(ratingResult.rows[0].review_count),
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/albums
 * Purpose: Create a new album
 * Access: Admin only
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, artist_name, release_year, genre, description, image_url, video_url, tracks } = req.body;

    if (!title || !artist_name) {
      return res.status(400).json({ error: 'Title and artist name are required' });
    }

    // Find or create artist
    let artistId;
    const artistResult = await db.query(
      'SELECT artist_id FROM artists WHERE LOWER(name) = LOWER($1)',
      [artist_name]
    );

    if (artistResult.rows.length > 0) {
      artistId = artistResult.rows[0].artist_id;
    } else {
      const newArtist = await db.query(
        'INSERT INTO artists (name) VALUES ($1) RETURNING artist_id',
        [artist_name]
      );
      artistId = newArtist.rows[0].artist_id;
    }

    // Insert album
    const result = await db.query(
      `INSERT INTO albums (title, artist_id, release_year, genre, description, image_url, video_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING album_id`,
      [title, artistId, release_year, genre, description, image_url, video_url]
    );

    const albumId = result.rows[0].album_id;

    // Insert tracks if provided
    if (tracks && Array.isArray(tracks)) {
      for (const track of tracks) {
        await db.query(
          'INSERT INTO tracks (album_id, title, duration_seconds, track_number) VALUES ($1, $2, $3, $4)',
          [albumId, track.title, track.durationSeconds, track.trackNumber]
        );
      }
    }

    res.status(201).json({
      albumId,
      message: 'Album created successfully',
    });
  } catch (error) {
    console.error('Error creating album:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/albums/:id
 * Purpose: Update album information
 * Access: Admin only
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist_name, release_year, genre, description, image_url, video_url } = req.body;

    // Find or create artist if artist_name is provided
    let artistId;
    if (artist_name) {
      const artistResult = await db.query(
        'SELECT artist_id FROM artists WHERE LOWER(name) = LOWER($1)',
        [artist_name]
      );

      if (artistResult.rows.length > 0) {
        artistId = artistResult.rows[0].artist_id;
      } else {
        const newArtist = await db.query(
          'INSERT INTO artists (name) VALUES ($1) RETURNING artist_id',
          [artist_name]
        );
        artistId = newArtist.rows[0].artist_id;
      }
    }

    const result = await db.query(
      `UPDATE albums 
       SET title = COALESCE($1, title),
           artist_id = COALESCE($2, artist_id),
           release_year = COALESCE($3, release_year),
           genre = COALESCE($4, genre),
           description = COALESCE($5, description),
           image_url = COALESCE($6, image_url),
           video_url = COALESCE($7, video_url)
       WHERE album_id = $8
       RETURNING *`,
      [title, artistId, release_year, genre, description, image_url, video_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    res.json({
      message: 'Album updated successfully',
      album: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating album:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/albums/:id
 * Purpose: Delete an album
 * Access: Admin only
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM albums WHERE album_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
