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
    console.log('Users API - Authenticated user:', user);
    
    // Only admins can access user management
    if (user.role !== 'admin') {
      console.log('Users API - Not admin, role:', user.role);
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
      // Get all users
      const result = await db.query(
        `SELECT user_id, username, email, role, created_at 
         FROM users 
         ORDER BY created_at DESC`
      );
      console.log('Users API - Returning', result.rows.length, 'users');
      return res.json(result.rows);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Users API error:', error.message);
    return res.status(401).json({ error: 'Unauthorized', message: error.message });
  }
}
