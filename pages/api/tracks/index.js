import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handleGet(req, res) {
  try {
    const { albumId } = req.query;
    
    let query = 'SELECT * FROM tracks';
    let params = [];
    
    if (albumId) {
      query += ' WHERE album_id = $1 ORDER BY track_number';
      params = [albumId];
    } else {
      query += ' ORDER BY album_id, track_number';
    }
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handlePost(req, res) {
  try {
    const { album_id, track_number, title, duration, lyrics, video_url } = req.body;
    
    if (!album_id || !track_number || !title) {
      return res.status(400).json({ error: 'Album ID, track number, and title are required' });
    }
    
    const result = await db.query(
      'INSERT INTO tracks (album_id, track_number, title, duration, lyrics, video_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [album_id, track_number, title, duration || null, lyrics || null, video_url || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating track:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  
  if (req.method === 'POST') {
    return withAuth(handlePost, { requireAdmin: true })(req, res);
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
