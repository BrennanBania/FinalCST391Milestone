import db from '../../../../database/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
}
