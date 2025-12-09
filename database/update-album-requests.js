const db = require('./db');

(async () => {
  try {
    console.log('Adding artist_name column to album_requests table...');
    
    // Add artist_name column
    await db.query('ALTER TABLE album_requests ADD COLUMN IF NOT EXISTS artist_name VARCHAR(255)');
    
    // Make artist_id nullable since we're using artist_name now
    await db.query('ALTER TABLE album_requests ALTER COLUMN artist_id DROP NOT NULL');
    
    console.log('Successfully updated album_requests table!');
    console.log('- Added artist_name column');
    console.log('- Made artist_id nullable');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating table:', error);
    process.exit(1);
  }
})();
