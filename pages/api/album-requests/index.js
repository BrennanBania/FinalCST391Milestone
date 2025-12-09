import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handlePost(req, res) {
  try {
    const { title, artist_name, release_year, genre, image_url, video_url } = req.body;
    const userId = req.user.userId;

    if (!title || !artist_name) {
      return res.status(400).json({ error: 'Title and artist name are required' });
    }

    // First, find or create the artist
    let artistResult = await db.query(
      'SELECT artist_id FROM artists WHERE LOWER(name) = LOWER($1)',
      [artist_name]
    );

    let artistId;
    if (artistResult.rows.length > 0) {
      artistId = artistResult.rows[0].artist_id;
    } else {
      // Create new artist
      const newArtist = await db.query(
        'INSERT INTO artists (name) VALUES ($1) RETURNING artist_id',
        [artist_name]
      );
      artistId = newArtist.rows[0].artist_id;
    }

    // Insert album request
    const result = await db.query(
      `INSERT INTO album_requests (title, artist_id, release_year, genre, image_url, video_url, requested_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING request_id`,
      [title, artistId, release_year, genre, image_url, video_url, userId]
    );

    res.status(201).json({
      message: 'Album request submitted successfully',
      requestId: result.rows[0].request_id,
    });
  } catch (error) {
    console.error('Error creating album request:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handleGet(req, res) {
  try {
    const { status } = req.query;
    let whereClause = '';
    
    if (status && status !== 'all') {
      whereClause = `WHERE ar.status = '${status}'`;
    }

    const result = await db.query(
      `SELECT ar.*, u.username, art.name as artist_name
       FROM album_requests ar
       JOIN users u ON ar.requested_by = u.user_id
       LEFT JOIN artists art ON ar.artist_id = art.artist_id
       ${whereClause}
       ORDER BY ar.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching album requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return withAuth(handlePost)(req, res);
  } else if (req.method === 'GET') {
    return withAuth(handleGet, { requireAdmin: true })(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
