import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.user.userId;
    const { albumId } = req.query;

    const result = await db.query(
      'DELETE FROM user_collections WHERE user_id = $1 AND album_id = $2 RETURNING *',
      [userId, albumId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Album not in collection' });
    }

    res.json({ message: 'Album removed from collection' });
  } catch (error) {
    console.error('Error removing from collection:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export default withAuth(handler, { requireCustomer: true });
