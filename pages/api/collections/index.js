import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handleGet(req, res) {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT uc.collection_id, uc.added_at, a.*, ar.name as artist_name
       FROM user_collections uc
       JOIN albums a ON uc.album_id = a.album_id
       JOIN artists ar ON a.artist_id = ar.artist_id
       WHERE uc.user_id = $1
       ORDER BY uc.added_at DESC`,
      [userId]
    );

    res.json({ collection: result.rows });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handlePost(req, res) {
  try {
    const userId = req.user.userId;
    const { albumId } = req.body;

    if (!albumId) {
      return res.status(400).json({ error: 'Album ID is required' });
    }

    // Check if album exists
    const albumCheck = await db.query('SELECT * FROM albums WHERE album_id = $1', [albumId]);

    if (albumCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if already in collection
    const existingCheck = await db.query(
      'SELECT * FROM user_collections WHERE user_id = $1 AND album_id = $2',
      [userId, albumId]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Album already in collection' });
    }

    // Add to collection
    await db.query(
      'INSERT INTO user_collections (user_id, album_id) VALUES ($1, $2)',
      [userId, albumId]
    );

    res.status(201).json({ message: 'Album added to collection' });
  } catch (error) {
    console.error('Error adding to collection:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export default withAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, { requireCustomer: true });
