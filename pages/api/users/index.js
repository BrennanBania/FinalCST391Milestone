import db from '../../../database/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    const user = verifyToken(req);
    
    // Only admins can access user management
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
      // Get all users
      const result = await db.query(
        `SELECT user_id, username, email, role, created_at 
         FROM users 
         ORDER BY created_at DESC`
      );
      return res.status(200).json(result.rows);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
