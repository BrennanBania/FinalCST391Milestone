const db = require('./db');

async function seedDatabase() {
  try {
    console.log('Checking for existing data...');
    
    // Check if albums exist
    const albumsResult = await db.query('SELECT COUNT(*) FROM albums');
    const albumCount = parseInt(albumsResult.rows[0].count);
    
    if (albumCount > 0) {
      console.log(`Database already has ${albumCount} albums. Skipping seed.`);
      process.exit(0);
    }

    console.log('Seeding database with sample data...');

    // Insert sample artists
    await db.query(`
      INSERT INTO artists (name, bio, country, formed_year, image_url) VALUES
      ('The Beatles', 'English rock band formed in Liverpool in 1960, regarded as the most influential band of all time.', 'United Kingdom', 1960, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Beatles_ad_1965_just_the_beatles_crop.jpg/300px-Beatles_ad_1965_just_the_beatles_crop.jpg'),
      ('Pink Floyd', 'English rock band known for philosophical lyrics, sonic experimentation, and elaborate live shows.', 'United Kingdom', 1965, 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d6/Pink_Floyd_-_all_members.jpg/300px-Pink_Floyd_-_all_members.jpg'),
      ('Michael Jackson', 'American singer, songwriter, and dancer, dubbed the "King of Pop".', 'United States', 1971, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Michael_Jackson_in_1988.jpg/220px-Michael_Jackson_in_1988.jpg')
    `);
    console.log('✓ Artists inserted');

    // Insert sample albums with video URLs
    await db.query(`
      INSERT INTO albums (title, artist_id, release_year, genre, description, image_url, video_url) VALUES
      ('Abbey Road', 1, 1969, 'Rock', 'The eleventh studio album by the Beatles, featuring the famous crossing photo and many classic tracks.', 'https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg', 'https://www.youtube.com/watch?v=KJwKi0a3HfQ'),
      ('The Dark Side of the Moon', 2, 1973, 'Progressive Rock', 'Pink Floyd''s eighth album, exploring themes of conflict, greed, time, and mental illness.', 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png', 'https://www.youtube.com/watch?v=DVQ3-Xe_suY'),
      ('Thriller', 3, 1982, 'Pop', 'Michael Jackson''s Thriller is the best-selling album of all time and a pop-culture landmark.', 'https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png', 'https://www.youtube.com/watch?v=sOnqjkJTMaA')
    `);
    console.log('✓ Albums inserted');

    // Insert sample tracks for Abbey Road
    await db.query(`
      INSERT INTO tracks (album_id, title, duration_seconds, track_number) VALUES
      (1, 'Come Together', 259, 1),
      (1, 'Something', 182, 2),
      (1, 'Maxwell''s Silver Hammer', 207, 3),
      (1, 'Oh! Darling', 206, 4),
      (1, 'Here Comes the Sun', 185, 5)
    `);

    // Insert sample tracks for Dark Side of the Moon
    await db.query(`
      INSERT INTO tracks (album_id, title, duration_seconds, track_number) VALUES
      (2, 'Speak to Me', 90, 1),
      (2, 'Breathe', 163, 2),
      (2, 'On the Run', 216, 3),
      (2, 'Time', 413, 4),
      (2, 'Money', 382, 5)
    `);

    // Insert sample tracks for Thriller
    await db.query(`
      INSERT INTO tracks (album_id, title, duration_seconds, track_number) VALUES
      (3, 'Wanna Be Startin'' Somethin''', 363, 1),
      (3, 'Baby Be Mine', 260, 2),
      (3, 'The Girl Is Mine', 222, 3),
      (3, 'Thriller', 357, 4),
      (3, 'Beat It', 258, 5)
    `);
    console.log('✓ Tracks inserted');

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
