import db from '../../../database/db';
import { withAuth } from '../../../lib/auth';

async function handlePut(req, res, id) {
  try {
    const { status } = req.body;
    const adminUserId = req.user.userId;

    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "denied"' });
    }

    // Get the request details
    const requestResult = await db.query(
      'SELECT * FROM album_requests WHERE request_id = $1 AND status = \'pending\'',
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    const request = requestResult.rows[0];
    let albumId = null;

    // If approving, create the album
    if (status === 'approved') {
      const albumResult = await db.query(
        `INSERT INTO albums (title, artist_id, release_year, genre, description, image_url, video_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING album_id`,
        [request.title, request.artist_id, request.release_year, request.genre, request.description, request.image_url, request.video_url]
      );
      albumId = albumResult.rows[0].album_id;
    }

    // Update request status
    await db.query(
      `UPDATE album_requests 
       SET status = $1, reviewed_at = NOW(), reviewed_by = $2
       WHERE request_id = $3`,
      [status, adminUserId, id]
    );

    res.json({
      message: `Album request ${status}`,
      ...(albumId && { albumId })
    });
  } catch (error) {
    console.error('Error updating album request:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handlePatch(req, res, id) {
  try {
    const { title, artist_name, release_year, genre, image_url, video_url, description } = req.body;

    // Find or create artist if artist_name provided
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
      `UPDATE album_requests
       SET title = COALESCE($1, title),
           artist_id = COALESCE($2, artist_id),
           release_year = COALESCE($3, release_year),
           genre = COALESCE($4, genre),
           image_url = COALESCE($5, image_url),
           video_url = COALESCE($6, video_url),
           description = COALESCE($7, description)
       WHERE request_id = $8
       RETURNING *`,
      [title, artistId, release_year, genre, image_url, video_url, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Album request not found' });
    }

    res.json({
      message: 'Album request updated successfully',
      request: result.rows[0],
    });
  } catch (error) {
    console.error('Error editing album request:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export default withAuth(async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    return handlePut(req, res, id);
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res, id);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, { requireAdmin: true });
