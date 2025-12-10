require('dotenv').config({ path: './api/.env' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupAlbumRequests() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create album_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS album_requests (
        request_id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist_id INTEGER REFERENCES artists(artist_id),
        release_year INTEGER,
        genre VARCHAR(100),
        description TEXT,
        image_url TEXT,
        video_url TEXT,
        requested_by INTEGER REFERENCES users(user_id) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(user_id)
      )
    `);
    console.log('✓ album_requests table created');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_album_requests_status ON album_requests(status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_album_requests_user ON album_requests(requested_by)
    `);
    console.log('✓ Indexes created');

    console.log('\nSetup complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

setupAlbumRequests();
