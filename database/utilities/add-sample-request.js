const db = require('./db');

(async () => {
  try {
    console.log('Adding sample album request...');
    
    // Get a customer user ID (assuming user_id 4 exists from earlier registration)
    const userResult = await db.query("SELECT user_id FROM users WHERE role = 'customer' LIMIT 1");
    
    if (userResult.rows.length === 0) {
      console.log('No customer user found. Please register a user first.');
      process.exit(1);
    }
    
    const userId = userResult.rows[0].user_id;
    
    const result = await db.query(
      `INSERT INTO album_requests 
       (user_id, title, artist_name, release_year, genre, image_url, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        userId,
        'Thriller',
        'Michael Jackson',
        1982,
        'Pop',
        'https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png',
        'pending'
      ]
    );
    
    console.log('Sample album request added successfully:');
    console.log(result.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
