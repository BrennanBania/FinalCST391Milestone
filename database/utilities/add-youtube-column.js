const db = require('./db');

(async () => {
  try {
    console.log('Adding youtube_url column to albums table...');
    await db.query('ALTER TABLE albums ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255)');
    console.log('Column added successfully!');
    
    console.log('\nChecking albums table structure...');
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'albums' 
      ORDER BY ordinal_position
    `);
    console.log('Albums table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
