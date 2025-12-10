import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handleGet(req, res, id) {
  try {
    const result = await db.query('SELECT * FROM tracks WHERE track_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching track:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handlePut(req, res, id) {
  try {
    const { track_number, title, duration, lyrics, video_url } = req.body;
    
    console.log('Updating track with ID:', id);
    console.log('Track data:', { track_number, title, duration, lyrics: lyrics?.substring(0, 50), video_url });
    
    const result = await db.query(
      'UPDATE tracks SET track_number = $1, title = $2, duration = $3, lyrics = $4, video_url = $5 WHERE track_id = $6 RETURNING *',
      [track_number, title, duration || null, lyrics || null, video_url || null, id]
    );
    
    console.log('Update result rows:', result.rows.length);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating track:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handleDelete(req, res, id) {
  try {
    const result = await db.query('DELETE FROM tracks WHERE track_id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.status(200).json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handlePutWithAuth(req, res) {
  const { id } = req.query;
  return handlePut(req, res, id);
}

async function handleDeleteWithAuth(req, res) {
  const { id } = req.query;
  return handleDelete(req, res, id);
}

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (req.method === 'GET') {
    return handleGet(req, res, id);
  }
  
  if (req.method === 'PUT') {
    return withAuth(handlePutWithAuth, { requireAdmin: true })(req, res);
  }
  
  if (req.method === 'DELETE') {
    return withAuth(handleDeleteWithAuth, { requireAdmin: true })(req, res);
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
