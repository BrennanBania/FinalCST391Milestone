import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handleGet(req, res) {
  try {
    const result = await db.query('SELECT * FROM artists ORDER BY name');
    res.json({ artists: result.rows });
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handlePost(req, res) {
  try {
    const { name, bio, country, formedYear, imageUrl } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    const result = await db.query(
      'INSERT INTO artists (name, bio, country, formed_year, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING artist_id',
      [name, bio, country, formedYear, imageUrl]
    );

    res.status(201).json({
      artistId: result.rows[0].artist_id,
      message: 'Artist created successfully',
    });
  } catch (error) {
    console.error('Error creating artist:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return withAuth(handlePost, { requireAdmin: true })(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
