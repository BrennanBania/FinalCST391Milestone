import db from './db.js';

async function updateTracksSchema() {
  const client = await db.pool.connect();
  
  try {
    console.log('Updating tracks table schema...');
    
    // Check if duration column exists (as TEXT)
    const durationCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tracks' AND column_name IN ('duration', 'duration_seconds')
    `);
    
    console.log('Current duration columns:', durationCheck.rows);
    
    // If we have duration_seconds but not duration, rename it
    const hasDurationSeconds = durationCheck.rows.some(r => r.column_name === 'duration_seconds');
    const hasDuration = durationCheck.rows.some(r => r.column_name === 'duration');
    
    if (hasDurationSeconds && !hasDuration) {
      console.log('Renaming duration_seconds to duration and changing to TEXT...');
      // Drop the old column and create new one as TEXT
      await client.query('ALTER TABLE tracks DROP COLUMN IF EXISTS duration_seconds CASCADE');
      await client.query('ALTER TABLE tracks ADD COLUMN duration VARCHAR(20)');
      console.log('✅ Duration column updated!');
    } else if (!hasDuration) {
      console.log('Adding duration column as VARCHAR...');
      await client.query('ALTER TABLE tracks ADD COLUMN duration VARCHAR(20)');
      console.log('✅ Duration column added!');
    } else {
      console.log('✓ Duration column already exists');
    }
    
    // Add lyrics column if it doesn't exist
    const lyricsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tracks' AND column_name = 'lyrics'
    `);
    
    if (lyricsCheck.rows.length === 0) {
      console.log('Adding lyrics column...');
      await client.query('ALTER TABLE tracks ADD COLUMN lyrics TEXT');
      console.log('✅ Lyrics column added!');
      
      // Add sample lyrics to first few tracks
      const { rows: tracks } = await client.query('SELECT track_id, title FROM tracks LIMIT 3');
      
      for (const track of tracks) {
        const sampleLyrics = `[Verse 1]\nSample lyrics for ${track.title}\nThese are placeholder lyrics\nTo demonstrate the feature\n\n[Chorus]\nLa la la la\nLa la la la\n\n[Verse 2]\nMore sample lyrics here\nFor demonstration purposes\nReplace with actual lyrics`;
        
        await client.query(
          'UPDATE tracks SET lyrics = $1 WHERE track_id = $2',
          [sampleLyrics, track.track_id]
        );
      }
      console.log('✅ Sample lyrics added!');
    } else {
      console.log('✓ Lyrics column already exists');
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

updateTracksSchema().catch(console.error);
