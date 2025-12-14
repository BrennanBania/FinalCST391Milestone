import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handlePut(req, res, id) {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { rating, review_text, reviewText } = req.body;
    
    // Accept either review_text or reviewText
    const text = review_text !== undefined ? review_text : reviewText;

    console.log('Updating review:', { id, rating, text, body: req.body });

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
    const result = await db.query(
      'UPDATE reviews SET rating = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP WHERE review_id = $3 RETURNING *',
      [rating, text || '', id]
    );
    
    console.log('Review updated in DB:', result.rows[0]);

    // Refresh top albums cache after rating update
    try {
      const { refreshTopAlbumsCache } = require('../../../lib/topAlbumsCache');
      refreshTopAlbumsCache().catch(err => console.error('Cache refresh error:', err));
    } catch (err) {
      console.error('Failed to refresh top albums cache:', err);
    }

    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handleDelete(req, res, id) {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check if review exists
    const reviewCheck = await db.query('SELECT * FROM reviews WHERE review_id = $1', [id]);

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Allow delete if user owns the review OR is an admin
    if (reviewCheck.rows[0].user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await db.query('DELETE FROM reviews WHERE review_id = $1', [id]);

    // Refresh top albums cache after deleting review
    try {
      const { refreshTopAlbumsCache } = require('../../../lib/topAlbumsCache');
      refreshTopAlbumsCache().catch(err => console.error('Cache refresh error:', err));
    } catch (err) {
      console.error('Failed to refresh top albums cache:', err);
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handlePatch(req, res, id) {
  try {
    const { flagged } = req.body;

    const result = await db.query(
      'UPDATE reviews SET is_flagged = $1 WHERE review_id = $2 RETURNING *',
      [flagged, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({
      message: `Review ${flagged ? 'flagged' : 'unflagged'} successfully`,
      review: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating review flag:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    return withAuth((req, res) => handlePut(req, res, id))(req, res);
  } else if (req.method === 'DELETE') {
    return withAuth((req, res) => handleDelete(req, res, id))(req, res);
  } else if (req.method === 'PATCH') {
    return withAuth((req, res) => handlePatch(req, res, id))(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
