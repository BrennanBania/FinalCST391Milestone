import db from './db.js';

async function addLyricsColumn() {
  const client = await db.pool.connect();
  
  try {
    console.log('Adding lyrics column to tracks table...');
    
    // Add lyrics column to tracks table
    await client.query(`
      ALTER TABLE tracks 
      ADD COLUMN IF NOT EXISTS lyrics TEXT;
    `);
    
    console.log('✅ Lyrics column added successfully!');
    
    // Add some sample lyrics for existing tracks
    console.log('Adding sample lyrics to existing tracks...');
    
    const { rows: tracks } = await client.query('SELECT track_id, title FROM tracks LIMIT 5');
    
    for (const track of tracks) {
      const sampleLyrics = `[Verse 1]\nSample lyrics for ${track.title}\nThese are placeholder lyrics\nTo demonstrate the feature\n\n[Chorus]\nLa la la la\nLa la la la\n\n[Verse 2]\nMore sample lyrics here\nFor demonstration purposes\nReplace with actual lyrics`;
      
      await client.query(
        'UPDATE tracks SET lyrics = $1 WHERE track_id = $2',
        [sampleLyrics, track.track_id]
      );
    }
    
    console.log('✅ Sample lyrics added!');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

addLyricsColumn().catch(console.error);
