import db from './db.js';

async function listTracks() {
  try {
    const result = await db.query(`
      SELECT t.track_id, t.album_id, t.track_number, t.title, t.duration, 
             a.title as album_title, a.artist_name
      FROM tracks t
      JOIN albums a ON t.album_id = a.album_id
      ORDER BY t.album_id, t.track_number
    `);
    
    console.log('\n=== ALL TRACKS IN DATABASE ===');
    console.log(`Total: ${result.rows.length} tracks\n`);
    
    if (result.rows.length === 0) {
      console.log('No tracks found in database!');
    } else {
      result.rows.forEach(track => {
        console.log(`Track ID: ${track.track_id} | Album ID: ${track.album_id} | Track #${track.track_number}`);
        console.log(`  Album: ${track.album_title} by ${track.artist_name}`);
        console.log(`  Title: ${track.title}`);
        console.log(`  Duration: ${track.duration || 'N/A'}`);
        console.log('---');
      });
    }
    
    // Check specifically for album_id 6 (Bad by Michael Jackson)
    const badAlbum = await db.query('SELECT * FROM tracks WHERE album_id = $1', [6]);
    console.log('\n=== TRACKS FOR ALBUM ID 6 (Bad) ===');
    console.log(`Found ${badAlbum.rows.length} tracks`);
    badAlbum.rows.forEach(t => {
      console.log(`  Track ID: ${t.track_id}, #${t.track_number}: ${t.title}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listTracks();
