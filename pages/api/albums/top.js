import db from '../../../database/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
