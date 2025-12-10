import db from './db.js';

async function addGitHubIdColumn() {
  const client = await db.pool.connect();
  
  try {
    console.log('Adding github_id column to users table...');
    
    // Check if column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'github_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN github_id VARCHAR(255) UNIQUE;
      `);
      console.log('✅ github_id column added successfully!');
    } else {
      console.log('✓ github_id column already exists');
    }
    
    // Also make password_hash nullable for OAuth users
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN password_hash DROP NOT NULL;
    `);
    console.log('✅ password_hash column made nullable for OAuth users');
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

addGitHubIdColumn().catch(console.error);
