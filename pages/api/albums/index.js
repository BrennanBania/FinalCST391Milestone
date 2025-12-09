import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res) {
  try {
    const { page = 1, limit = 10, genre, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, ar.name as artist_name,
             COALESCE(AVG(r.rating), 0)::float as avg_rating,
             COUNT(r.review_id)::int as review_count
      FROM albums a
      JOIN artists ar ON a.artist_id = ar.artist_id
      LEFT JOIN reviews r ON a.album_id = r.album_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (genre) {
      paramCount++;
      query += ` AND a.genre ILIKE $${paramCount}`;
      params.push(`%${genre}%`);
    }

    if (search) {
      paramCount++;
      query += ` AND (a.title ILIKE $${paramCount} OR ar.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY a.album_id, ar.artist_id, ar.name`;
    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM albums a JOIN artists ar ON a.artist_id = ar.artist_id WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (genre) {
      countParamCount++;
      countQuery += ` AND a.genre ILIKE $${countParamCount}`;
      countParams.push(`%${genre}%`);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (a.title ILIKE $${countParamCount} OR ar.name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      albums: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handlePost(req, res) {
  try {
    const { title, artist_name, release_year, genre, description, image_url, video_url, tracks } = req.body;

    if (!title || !artist_name) {
      return res.status(400).json({ error: 'Title and artist name are required' });
    }

    // Find or create artist
    let artistId;
    const artistResult = await db.query(
      'SELECT artist_id FROM artists WHERE LOWER(name) = LOWER($1)',
      [artist_name]
    );

    if (artistResult.rows.length > 0) {
      artistId = artistResult.rows[0].artist_id;
    } else {
      const newArtist = await db.query(
        'INSERT INTO artists (name) VALUES ($1) RETURNING artist_id',
        [artist_name]
      );
      artistId = newArtist.rows[0].artist_id;
    }

    // Insert album
    const result = await db.query(
      `INSERT INTO albums (title, artist_id, release_year, genre, description, image_url, video_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING album_id`,
      [title, artistId, release_year, genre, description, image_url, video_url]
    );

    const albumId = result.rows[0].album_id;

    // Insert tracks if provided
    if (tracks && Array.isArray(tracks)) {
      for (const track of tracks) {
        await db.query(
          'INSERT INTO tracks (album_id, title, duration_seconds, track_number) VALUES ($1, $2, $3, $4)',
          [albumId, track.title, track.durationSeconds, track.trackNumber]
        );
      }
    }

    res.status(201).json({
      albumId,
      message: 'Album created successfully',
    });
  } catch (error) {
    console.error('Error creating album:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export default function (req, res) {
  if (req.method === 'POST') {
    return withAuth(handler, { requireAdmin: true })(req, res);
  }
  return handler(req, res);
}
