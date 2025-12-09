require('dotenv').config({ path: './api/.env' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkBadAlbum() {
  try {
    await client.connect();
    console.log('Connected to database');

    const result = await client.query(
      "SELECT album_id, title, video_url FROM albums WHERE title ILIKE '%bad%'"
    );

    console.log('\nBad Album Data:');
    console.log(result.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkBadAlbum();
