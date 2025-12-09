const db = require('./db');

(async () => {
  try {
    const result = await db.query("SELECT album_id, title, youtube_url FROM albums WHERE title LIKE '%Born%'");
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
