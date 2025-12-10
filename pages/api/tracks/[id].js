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
    const { track_number, title, duration } = req.body;
    
    const result = await db.query(
      'UPDATE tracks SET track_number = $1, title = $2, duration = $3 WHERE track_id = $4 RETURNING *',
      [track_number, title, duration || null, id]
    );
    
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
    
    res.json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (req.method === 'GET') {
    return handleGet(req, res, id);
  }
  
  if (req.method === 'PUT') {
    return withAuth(handlePut, { requireAdmin: true })(req, res, id);
  }
  
  if (req.method === 'DELETE') {
    return withAuth(handleDelete, { requireAdmin: true })(req, res, id);
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
