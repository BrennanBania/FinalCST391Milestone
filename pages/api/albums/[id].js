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

    // Get tracks for the album (exclude lyrics for better performance)
    const tracksResult = await db.query(
      'SELECT track_id, album_id, title, duration, track_number, video_url, created_at FROM tracks WHERE album_id = $1 ORDER BY track_number',
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

    console.log('Updating album:', id, 'with data:', { title, artist_name, release_year, genre, description, image_url, video_url });

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

    console.log('Artist ID:', artistId);

    // Build update query dynamically to only update provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined && title !== '') {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (artistId !== undefined) {
      updates.push(`artist_id = $${paramCount++}`);
      values.push(artistId);
    }
    if (release_year !== undefined && release_year !== '') {
      updates.push(`release_year = $${paramCount++}`);
      values.push(parseInt(release_year));
    }
    if (genre !== undefined && genre !== '') {
      updates.push(`genre = $${paramCount++}`);
      values.push(genre);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }
    if (video_url !== undefined) {
      updates.push(`video_url = $${paramCount++}`);
      values.push(video_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE albums SET ${updates.join(', ')} WHERE album_id = $${paramCount} RETURNING *`;
    
    console.log('Executing query:', query, 'with values:', values);

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    console.log('Update successful:', result.rows[0]);

    res.json({
      message: 'Album updated successfully',
      album: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating album:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

async function handleDelete(req, res, id) {
  try {
    const result = await db.query('DELETE FROM albums WHERE album_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    res.status(200).json({ message: 'Album deleted successfully' });
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
