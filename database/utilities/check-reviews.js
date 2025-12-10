const db = require('./db');

async function checkReviews() {
  try {
    console.log('Checking all reviews in database...\n');
    
    const result = await db.query(
      `SELECT r.*, u.username, a.title as album_title, ar.name as artist_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       JOIN albums a ON r.album_id = a.album_id
       JOIN artists ar ON a.artist_id = ar.artist_id
       ORDER BY r.created_at DESC`
    );
    
    console.log(`Found ${result.rows.length} review(s):\n`);
    result.rows.forEach(review => {
      console.log(`Review ID: ${review.review_id}`);
      console.log(`Album: ${review.album_title}`);
      console.log(`Artist: ${review.artist_name}`);
      console.log(`User: ${review.username}`);
      console.log(`Rating: ${review.rating} stars`);
      console.log(`Text: ${review.review_text}`);
      console.log(`Date: ${review.created_at}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking reviews:', error);
    process.exit(1);
  }
}

checkReviews();
