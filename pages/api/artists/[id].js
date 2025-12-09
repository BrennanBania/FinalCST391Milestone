import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handleGet(req, res, id) {
  try {
    const artistResult = await db.query('SELECT * FROM artists WHERE artist_id = $1', [id]);

    if (artistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const albumsResult = await db.query(
      'SELECT * FROM albums WHERE artist_id = $1 ORDER BY release_year DESC',
      [id]
    );

    res.json({
      artist: artistResult.rows[0],
      albums: albumsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handlePut(req, res, id) {
  try {
    const { name, bio, country, formedYear, imageUrl } = req.body;

    const result = await db.query(
      `UPDATE artists 
       SET name = COALESCE($1, name),
           bio = COALESCE($2, bio),
           country = COALESCE($3, country),
           formed_year = COALESCE($4, formed_year),
           image_url = COALESCE($5, image_url)
       WHERE artist_id = $6
       RETURNING *`,
      [name, bio, country, formedYear, imageUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json({
      message: 'Artist updated successfully',
      artist: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating artist:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handleDelete(req, res, id) {
  try {
    const result = await db.query('DELETE FROM artists WHERE artist_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json({ message: 'Artist deleted successfully' });
  } catch (error) {
    console.error('Error deleting artist:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    return handleGet(req, res, id);
  } else if (req.method === 'PUT') {
    return withAuth((req, res) => handlePut(req, res, id), { requireAdmin: true })(req, res);
  } else if (req.method === 'DELETE') {
    return withAuth((req, res) => handleDelete(req, res, id), { requireAdmin: true })(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
