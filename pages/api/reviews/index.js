import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handleGetAll(req, res) {
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
}

async function handlePost(req, res) {
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

      const reviewId = result.rows[0].review_id;
      res.status(201).json({
        reviewId,
        message: 'Review created successfully',
      });
    }
  } catch (error) {
    console.error('Error creating/updating review:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Allow anyone to view reviews - no auth required
    return handleGetAll(req, res);
  } else if (req.method === 'POST') {
    return withAuth(handlePost, { requireCustomer: true })(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
