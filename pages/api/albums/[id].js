import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handleGet(req, res, id) {
  try {
    // Get album with artist info
    const albumResult = await db.query(
      `SELECT a.*, ar.name as artist_name, ar.bio as artist_bio, ar.country, ar.formed_year
       FROM albums a
       JOIN artists ar ON a.artist_id = ar.artist_id
       WHERE a.album_id = $1`,
      [id]
    );

    if (albumResult.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Get tracks for the album
    const tracksResult = await db.query(
      'SELECT * FROM tracks WHERE album_id = $1 ORDER BY track_number',
      [id]
    );

    // Get average rating
    const ratingResult = await db.query(
      'SELECT AVG(rating)::numeric(10,2) as avg_rating, COUNT(*) as review_count FROM reviews WHERE album_id = $1',
      [id]
    );

    res.json({
      album: albumResult.rows[0],
      tracks: tracksResult.rows,
      averageRating: parseFloat(ratingResult.rows[0].avg_rating) || 0,
      reviewCount: parseInt(ratingResult.rows[0].review_count),
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handlePut(req, res, id) {
  try {
    const { title, artist_name, release_year, genre, description, image_url, video_url } = req.body;

    // Find or create artist if artist_name is provided
    let artistId;
    if (artist_name) {
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
    }

    const result = await db.query(
      `UPDATE albums 
       SET title = COALESCE($1, title),
           artist_id = COALESCE($2, artist_id),
           release_year = COALESCE($3, release_year),
           genre = COALESCE($4, genre),
           description = COALESCE($5, description),
           image_url = COALESCE($6, image_url),
           video_url = COALESCE($7, video_url)
       WHERE album_id = $8
       RETURNING *`,
      [title, artistId, release_year, genre, description, image_url, video_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    res.json({
      message: 'Album updated successfully',
      album: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating album:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handleDelete(req, res, id) {
  try {
    const result = await db.query('DELETE FROM albums WHERE album_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    return handleGet(req, res, id);
  } else if (req.method === 'PUT') {
    return withAuth((req, res) => handlePut(req, res, id), { requireAdmin: true })(req, res);
  } else if (req.method === 'DELETE') {
    return withAuth((req, res) => handleDelete(req, res, id), { requireAdmin: true })(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
