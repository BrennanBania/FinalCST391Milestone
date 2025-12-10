import db from './db.js';

(async () => {
  try {
    console.log('Adding video_url column to tracks table...');
    await db.query('ALTER TABLE tracks ADD COLUMN IF NOT EXISTS video_url VARCHAR(500)');
    console.log('✓ video_url column added successfully!');
    
    console.log('\nChecking tracks table structure...');
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tracks' 
      ORDER BY ordinal_position
    `);
    console.log('Tracks table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
