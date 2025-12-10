const db = require('./db');

async function checkTrackVideos() {
  try {
    console.log('Checking tracks with video URLs...\n');
    
    const result = await db.query(`
      SELECT t.track_id, t.title, t.video_url, a.title as album_title
      FROM tracks t
      JOIN albums a ON t.album_id = a.album_id
      ORDER BY a.title, t.track_number
    `);

    console.log(`Total tracks: ${result.rows.length}\n`);
    
    const withVideo = result.rows.filter(t => t.video_url);
    const withoutVideo = result.rows.filter(t => !t.video_url);
    
    console.log(`Tracks WITH video_url: ${withVideo.length}`);
    if (withVideo.length > 0) {
      withVideo.forEach(t => {
        console.log(`  - ${t.album_title}: ${t.title} (${t.video_url})`);
      });
    }
    
    console.log(`\nTracks WITHOUT video_url: ${withoutVideo.length}`);
    if (withoutVideo.length > 0) {
      console.log('First 10 tracks without video:');
      withoutVideo.slice(0, 10).forEach(t => {
        console.log(`  - ${t.album_title}: ${t.title}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking tracks:', error);
    process.exit(1);
  }
}

checkTrackVideos();
