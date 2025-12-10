import db from './db.js';

async function checkTracks() {
  try {
    // Get all tracks
    const allTracks = await db.query('SELECT * FROM tracks ORDER BY album_id, track_number');
    console.log('\n=== ALL TRACKS ===');
    console.log(`Total tracks: ${allTracks.rows.length}\n`);
    
    allTracks.rows.forEach(track => {
      console.log(`Track ID: ${track.track_id}, Album ID: ${track.album_id}, #${track.track_number}: ${track.title}`);
      console.log(`  Duration: ${track.duration || 'N/A'}`);
      console.log(`  Video URL: ${track.video_url ? 'Yes' : 'No'}`);
      console.log(`  Lyrics: ${track.lyrics ? 'Yes' : 'No'}`);
      console.log('---');
    });
    
    // Check for the specific track ID 16
    const track16 = await db.query('SELECT * FROM tracks WHERE track_id = $1', [16]);
    console.log('\n=== TRACK ID 16 ===');
    if (track16.rows.length > 0) {
      console.log('Found:', track16.rows[0]);
    } else {
      console.log('Track ID 16 does NOT exist in database');
    }
    
    // Check tracks for "Bad" album
    const badAlbumTracks = await db.query(`
      SELECT t.*, a.title as album_title, a.artist_name 
      FROM tracks t
      JOIN albums a ON t.album_id = a.album_id
      WHERE a.title ILIKE '%bad%'
    `);
    console.log('\n=== TRACKS FOR "BAD" ALBUM ===');
    if (badAlbumTracks.rows.length > 0) {
      badAlbumTracks.rows.forEach(track => {
        console.log(`Track ID: ${track.track_id}, Album: ${track.album_title} by ${track.artist_name}`);
        console.log(`  #${track.track_number}: ${track.title}`);
      });
    } else {
      console.log('No tracks found for "Bad" album');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking tracks:', error);
    process.exit(1);
  }
}

checkTracks();
