const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * POST /api/album-requests
 * Purpose: Create a new album request (non-admin users)
 * Access: Authenticated users
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, artist_name, release_year, genre, image_url, video_url } = req.body;
    const userId = req.user.userId;

    if (!title || !artist_name) {
      return res.status(400).json({ error: 'Title and artist name are required' });
    }

    // First, find or create the artist
    let artistResult = await db.query(
      'SELECT artist_id FROM artists WHERE LOWER(name) = LOWER($1)',
      [artist_name]
    );

    let artistId;
    if (artistResult.rows.length > 0) {
      artistId = artistResult.rows[0].artist_id;
    } else {
      // Create new artist
      const newArtist = await db.query(
        'INSERT INTO artists (name) VALUES ($1) RETURNING artist_id',
        [artist_name]
      );
      artistId = newArtist.rows[0].artist_id;
    }

    // Insert album request
    const result = await db.query(
      `INSERT INTO album_requests (title, artist_id, release_year, genre, image_url, video_url, requested_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING request_id`,
      [title, artistId, release_year, genre, image_url, video_url, userId]
    );

    res.status(201).json({
      message: 'Album request submitted successfully',
      requestId: result.rows[0].request_id,
    });
  } catch (error) {
    console.error('Error creating album request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/album-requests
 * Purpose: Get album requests (admin only)
 * Query params: ?status=pending|approved|denied|all (default: all)
 * Access: Admin only
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let whereClause = '';
    
    if (status && status !== 'all') {
      whereClause = `WHERE ar.status = '${status}'`;
    }

    const result = await db.query(
      `SELECT ar.*, u.username, art.name as artist_name
       FROM album_requests ar
       JOIN users u ON ar.requested_by = u.user_id
       LEFT JOIN artists art ON ar.artist_id = art.artist_id
       ${whereClause}
       ORDER BY ar.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching album requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/album-requests/:id
 * Purpose: Update album request status (approve/deny)
 * Access: Admin only
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminUserId = req.user.userId;

    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "denied"' });
    }

    // Get the request details
    const requestResult = await db.query(
      'SELECT * FROM album_requests WHERE request_id = $1 AND status = \'pending\'',
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    const request = requestResult.rows[0];
    let albumId = null;

    // If approving, create the album
    if (status === 'approved') {
      const albumResult = await db.query(
        `INSERT INTO albums (title, artist_id, release_year, genre, description, image_url, video_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING album_id`,
        [request.title, request.artist_id, request.release_year, request.genre, request.description, request.image_url, request.video_url]
      );
      albumId = albumResult.rows[0].album_id;
    }

    // Update request status
    await db.query(
      `UPDATE album_requests 
       SET status = $1, reviewed_at = NOW(), reviewed_by = $2
       WHERE request_id = $3`,
      [status, adminUserId, id]
    );

    res.json({
      message: `Album request ${status}`,
      ...(albumId && { albumId })
    });
  } catch (error) {
    console.error('Error updating album request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/album-requests/:id/approve (DEPRECATED - Use PUT instead)
 * Purpose: Approve an album request and create the album
 * Access: Admin only
 */
router.post('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.userId;

    // Get the request details
    const requestResult = await db.query(
      'SELECT * FROM album_requests WHERE request_id = $1 AND status = \'pending\'',
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    const request = requestResult.rows[0];

    // Create the album
    const albumResult = await db.query(
      `INSERT INTO albums (title, artist_id, release_year, genre, description, image_url, video_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING album_id`,
      [request.title, request.artist_id, request.release_year, request.genre, request.description, request.image_url, request.video_url]
    );

    // Update request status
    await db.query(
      `UPDATE album_requests 
       SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1
       WHERE request_id = $2`,
      [adminUserId, id]
    );

    res.json({
      message: 'Album request approved and album created',
      albumId: albumResult.rows[0].album_id,
    });
  } catch (error) {
    console.error('Error approving album request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/album-requests/:id/deny (DEPRECATED - Use PUT instead)
 * Purpose: Deny an album request
 * Access: Admin only
 */
router.post('/:id/deny', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.userId;

    const result = await db.query(
      `UPDATE album_requests 
       SET status = 'denied', reviewed_at = NOW(), reviewed_by = $1
       WHERE request_id = $2 AND status = 'pending'
       RETURNING *`,
      [adminUserId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    res.json({ message: 'Album request denied' });
  } catch (error) {
    console.error('Error denying album request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PATCH /api/album-requests/:id
 * Purpose: Edit album request details
 * Access: Admin only
 */
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist_name, genre, release_year, image_url, video_url } = req.body;

    // Check if request exists and is still pending
    const checkResult = await db.query(
      'SELECT * FROM album_requests WHERE request_id = $1 AND status = \'pending\'',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    // Find or create artist if artist_name is provided
    let artistId = checkResult.rows[0].artist_id;
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

    // Update the request
    const result = await db.query(
      `UPDATE album_requests 
       SET title = COALESCE($1, title),
           artist_id = COALESCE($2, artist_id),
           genre = COALESCE($3, genre),
           release_year = COALESCE($4, release_year),
           image_url = COALESCE($5, image_url),
           video_url = COALESCE($6, video_url)
       WHERE request_id = $7
       RETURNING *`,
      [title, artistId, genre, release_year, image_url, video_url, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating album request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/album-requests/:id
 * Purpose: Delete a denied request
 * Access: Admin only
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM album_requests WHERE request_id = $1 AND status = $\'denied\' RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or cannot be deleted' });
    }

    res.json({ message: 'Album request deleted successfully' });
  } catch (error) {
    console.error('Error deleting album request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
