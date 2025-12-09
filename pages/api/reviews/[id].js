import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handlePut(req, res, id) {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
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
