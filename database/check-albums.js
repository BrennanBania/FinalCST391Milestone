require('dotenv').config({ path: './api/.env' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAlbums() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    const result = await client.query(
      'SELECT album_id, title, artist_id FROM albums ORDER BY album_id'
    );

    console.log(`Total albums: ${result.rows.length}\n`);
    console.log('Albums:');
    result.rows.forEach(album => {
      console.log(`  ID ${album.album_id}: ${album.title} (Artist ID: ${album.artist_id})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkAlbums();
