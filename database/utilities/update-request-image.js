require('dotenv').config({ path: './api/.env' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateRequestImage() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Update the image URL to use a working CDN image
    const result = await client.query(
      `UPDATE album_requests 
       SET image_url = 'https://lastfm.freetls.fastly.net/i/u/770x0/3b54885952161aaea4ce2965b2db1638.jpg'
       WHERE title ILIKE '%born to run%'
       RETURNING request_id, title, image_url`
    );

    console.log('\nUpdated album request:');
    console.log(result.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

updateRequestImage();
