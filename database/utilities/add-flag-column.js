const db = require('./db');

async function addFlagColumn() {
  try {
    console.log('Adding is_flagged column to reviews table...\n');
    
    // Add is_flagged column with default FALSE
    await db.query(`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE
    `);
    
    console.log('✅ Column added successfully!');
    
    // Verify the column was added
    const result = await db.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'reviews' AND column_name = 'is_flagged'
    `);
    
    if (result.rows.length > 0) {
      console.log('\nColumn details:');
      console.log(result.rows[0]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding column:', error);
    process.exit(1);
  }
}

addFlagColumn();
