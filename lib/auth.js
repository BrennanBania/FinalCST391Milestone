import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify JWT token from Next.js API request
 */
export function verifyToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw new Error('Access token required');
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return user;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withAuth(handler, options = {}) {
  return async (req, res) => {
    try {
      const user = verifyToken(req);
      req.user = user;

      // Check for admin role if required
      if (options.requireAdmin && user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Check for customer role if required
      if (options.requireCustomer && !user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      return await handler(req, res);
    } catch (error) {
      if (error.message === 'Access token required') {
        return res.status(401).json({ error: error.message });
      }
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  };
}
