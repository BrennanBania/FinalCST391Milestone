import jwt from 'jsonwebtoken';
import db from '../../../database/db';
import { JWT_SECRET } from '../../../lib/auth';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/github/callback`
  : 'http://localhost:3000/api/auth/github/callback';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('GitHub token error:', tokenData);
      return res.status(400).json({ error: 'Failed to get access token from GitHub' });
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    const githubUser = await userResponse.json();

    if (!githubUser.id) {
      return res.status(400).json({ error: 'Failed to get user info from GitHub' });
    }

    // Get user email (might need separate API call if primary email is private)
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      });
      const emails = await emailResponse.json();
      const primaryEmail = emails.find(e => e.primary);
      email = primaryEmail ? primaryEmail.email : emails[0]?.email;
    }

    if (!email) {
      return res.status(400).json({ error: 'No email found in GitHub account' });
    }

    // Check if user exists by GitHub ID or email
    let user;
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, `github_${githubUser.id}`]
    );

    if (existingUser.rows.length > 0) {
      // User exists, update if needed
      user = existingUser.rows[0];
      
      // Update github_id if not set
      if (!user.github_id) {
        await db.query(
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255)',
          []
        );
        await db.query(
          'UPDATE users SET github_id = $1 WHERE user_id = $2',
          [githubUser.id.toString(), user.user_id]
        );
      }
    } else {
      // Create new user
      // First ensure github_id column exists
      await db.query(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255)',
        []
      );

      const result = await db.query(
        `INSERT INTO users (username, email, password_hash, github_id, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          githubUser.login || `github_${githubUser.id}`,
          email,
          '', // No password for OAuth users
          githubUser.id.toString(),
          'customer'
        ]
      );
      user = result.rows[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Redirect to home page with token
    res.redirect(`/?token=${token}&username=${encodeURIComponent(user.username)}&role=${user.role}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
}
