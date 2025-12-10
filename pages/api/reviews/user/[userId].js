import db from '../../../../database/db';
import { withAuth } from '../../../../lib/auth';

async function handler(req, res) {
  const { userId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
}

export default handler;
