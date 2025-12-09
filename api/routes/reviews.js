const express = require('express');
const db = require('../../database/db');
const { authenticateToken, requireCustomer, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/albums/:id/reviews
 * Purpose: Get all reviews for an album
 * Access: Unauthenticated
 */
router.get('/albums/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;

    const reviewsResult = await db.query(
      `SELECT r.*, u.username
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.album_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    const ratingResult = await db.query(
      'SELECT AVG(rating)::numeric(10,2) as average_rating FROM reviews WHERE album_id = $1',
      [id]
    );

    res.json({
      reviews: reviewsResult.rows,
      averageRating: parseFloat(ratingResult.rows[0].average_rating) || 0,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/reviews
 * Purpose: Create or update a review
 * Access: Customer (authenticated)
 */
router.post('/', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { albumId, rating, reviewText } = req.body;

    if (!albumId || !rating) {
      return res.status(400).json({ error: 'Album ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if album exists
    const albumCheck = await db.query('SELECT * FROM albums WHERE album_id = $1', [albumId]);

    if (albumCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if review already exists
    const existingReview = await db.query(
      'SELECT * FROM reviews WHERE user_id = $1 AND album_id = $2',
      [userId, albumId]
    );

    let result;

    if (existingReview.rows.length > 0) {
      // Update existing review
      result = await db.query(
        'UPDATE reviews SET rating = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 AND album_id = $4 RETURNING review_id',
        [rating, reviewText, userId, albumId]
      );

      res.json({
        reviewId: result.rows[0].review_id,
        message: 'Review updated successfully',
      });
    } else {
      // Create new review
      result = await db.query(
        'INSERT INTO reviews (user_id, album_id, rating, review_text) VALUES ($1, $2, $3, $4) RETURNING review_id',
        [userId, albumId, rating, reviewText]
      );

      res.status(201).json({
        reviewId: result.rows[0].review_id,
        message: 'Review created successfully',
      });
    }
  } catch (error) {
    console.error('Error creating/updating review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/reviews/:id
 * Purpose: Update a review
 * Access: Customer (own reviews) or Admin (any review)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { id } = req.params;
    const { rating, reviewText } = req.body;

    // Check if review exists
    const reviewCheck = await db.query('SELECT * FROM reviews WHERE review_id = $1', [id]);

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Allow update if user owns the review OR is an admin
    if (reviewCheck.rows[0].user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Update review
    await db.query(
      'UPDATE reviews SET rating = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP WHERE review_id = $3',
      [rating, reviewText || '', id]
    );

    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/reviews
 * Purpose: Get all reviews (admin only)
 * Access: Admin
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const reviewsResult = await db.query(
      `SELECT r.*, u.username, a.title as album_title, ar.name as artist_name, a.image_url
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       JOIN albums a ON r.album_id = a.album_id
       JOIN artists ar ON a.artist_id = ar.artist_id
       ORDER BY r.created_at DESC`
    );

    res.json(reviewsResult.rows);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/reviews/user/:userId
 * Purpose: Get all reviews by a specific user
 * Access: Authenticated
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const reviewsResult = await db.query(
      `SELECT r.*, a.title as album_title, ar.name as artist_name, u.username
       FROM reviews r
       JOIN albums a ON r.album_id = a.album_id
       JOIN artists ar ON a.artist_id = ar.artist_id
       JOIN users u ON r.user_id = u.user_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(reviewsResult.rows);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/reviews/:id
 * Purpose: Delete a review
 * Access: Customer (own reviews) or Admin (any review)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { id } = req.params;

    // Check if review exists
    const reviewCheck = await db.query('SELECT * FROM reviews WHERE review_id = $1', [id]);

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Allow deletion if user owns the review OR is an admin
    if (reviewCheck.rows[0].user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await db.query('DELETE FROM reviews WHERE review_id = $1', [id]);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PATCH /api/reviews/:id
 * Purpose: Update review flag status
 * Access: Authenticated users (flag), Admin only (unflag)
 */
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { flagged } = req.body;

    if (typeof flagged !== 'boolean') {
      return res.status(400).json({ error: 'flagged must be a boolean' });
    }

    // Check if review exists
    const reviewCheck = await db.query('SELECT * FROM reviews WHERE review_id = $1', [id]);

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Admin can do both flag and unflag, users can only flag
    if (!flagged && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can unflag reviews' });
    }

    // Update flag status
    await db.query('UPDATE reviews SET is_flagged = $1 WHERE review_id = $2', [flagged, id]);

    res.json({ message: `Review ${flagged ? 'flagged' : 'unflagged'} successfully` });
  } catch (error) {
    console.error('Error updating review flag status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/reviews/:id/flag (DEPRECATED - Use PATCH instead)
 * Purpose: Flag a review as inappropriate
 * Access: Authenticated users
 */
router.put('/:id/flag', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if review exists
    const reviewCheck = await db.query('SELECT * FROM reviews WHERE review_id = $1', [id]);

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Flag the review
    await db.query('UPDATE reviews SET is_flagged = TRUE WHERE review_id = $1', [id]);

    res.json({ message: 'Review flagged successfully' });
  } catch (error) {
    console.error('Error flagging review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/reviews/:id/unflag (DEPRECATED - Use PATCH instead)
 * Purpose: Unflag a review (admin only)
 * Access: Admin
 */
router.put('/:id/unflag', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if review exists
    const reviewCheck = await db.query('SELECT * FROM reviews WHERE review_id = $1', [id]);

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Unflag the review
    await db.query('UPDATE reviews SET is_flagged = FALSE WHERE review_id = $1', [id]);

    res.json({ message: 'Review unflagged successfully' });
  } catch (error) {
    console.error('Error unflagging review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
