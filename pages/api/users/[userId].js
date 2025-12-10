import db from '../../../database/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) throw new Error('Access token required');
  return jwt.verify(token, JWT_SECRET);
}

export default async function handler(req, res) {
  try {
    const user = verifyToken(req);
    
    // Only admins can manage users
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.query;

    if (req.method === 'PATCH') {
      // Update user role
      const { role } = req.body;
      
      if (!['admin', 'customer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Prevent admin from demoting themselves
      if (parseInt(userId) === user.userId && role === 'customer') {
        return res.status(400).json({ error: 'You cannot demote yourself' });
      }

      const result = await db.query(
        'UPDATE users SET role = $1 WHERE user_id = $2 RETURNING user_id, username, email, role',
        [role, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('User update error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
