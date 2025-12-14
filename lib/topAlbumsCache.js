import db from '../database/db';

// Cache for top albums
let cachedTopAlbums = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes fallback

export async function refreshTopAlbumsCache() {
  try {
    const result = await db.query(
      `SELECT a.*, ar.name as artist_name, 
              COALESCE(AVG(r.rating), 0)::float as avg_rating,
              COUNT(r.review_id)::int as review_count
       FROM albums a
       JOIN artists ar ON a.artist_id = ar.artist_id
       LEFT JOIN reviews r ON a.album_id = r.album_id
       GROUP BY a.album_id, ar.artist_id, ar.name
       ORDER BY avg_rating DESC, review_count DESC, a.album_id ASC
       LIMIT 4`
    );
    
    cachedTopAlbums = result.rows;
    cacheTimestamp = Date.now();
    return cachedTopAlbums;
  } catch (error) {
    console.error('Error refreshing top albums cache:', error);
    throw error;
  }
}

export async function getTopAlbums() {
  // Use cache if it exists and is fresh, otherwise refresh
  if (!cachedTopAlbums || !cacheTimestamp || (Date.now() - cacheTimestamp) > CACHE_DURATION) {
    await refreshTopAlbumsCache();
  }
  return cachedTopAlbums;
}
