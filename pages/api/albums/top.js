import { getTopAlbums } from '../../../lib/topAlbumsCache';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const topAlbums = await getTopAlbums();
    res.json(topAlbums);
  } catch (error) {
    console.error('Error fetching top albums:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
