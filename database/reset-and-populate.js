import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function resetAndPopulate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    console.log('Connected to database');

    // Delete all existing data (in correct order to respect foreign keys)
    console.log('\n🗑️  Deleting all existing data...');
    await client.query('DELETE FROM album_requests');
    await client.query('DELETE FROM tracks');
    await client.query('DELETE FROM albums');
    await client.query('DELETE FROM artists');
    await client.query('ALTER SEQUENCE albums_album_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE tracks_track_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE artists_artist_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE album_requests_request_id_seq RESTART WITH 1');
    console.log('✅ All data deleted');

    // New albums with complete information
    const albums = [
      {
        title: 'The Dark Side of the Moon',
        artist: 'Pink Floyd',
        description: 'A landmark concept album exploring themes of conflict, greed, time, death, and mental illness. Features innovative studio techniques and seamless transitions between tracks.',
        release_year: 1973,
        genre: 'Progressive Rock',
        image_url: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png',
        tracks: [
          { title: 'Speak to Me', duration: '1:13' },
          { title: 'Breathe (In the Air)', duration: '2:43' },
          { title: 'On the Run', duration: '3:30' },
          { title: 'Time', duration: '6:53' },
          { title: 'The Great Gig in the Sky', duration: '4:36' },
          { title: 'Money', duration: '6:23' },
          { title: 'Us and Them', duration: '7:49' },
          { title: 'Any Colour You Like', duration: '3:26' },
          { title: 'Brain Damage', duration: '3:46' },
          { title: 'Eclipse', duration: '2:03' }
        ]
      },
      {
        title: 'Thriller',
        artist: 'Michael Jackson',
        description: 'The best-selling album of all time, blending pop, rock, and R&B with groundbreaking production. Revolutionary music videos changed the industry forever.',
        release_year: 1982,
        genre: 'Pop',
        image_url: 'https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png',
        tracks: [
          { title: 'Wanna Be Startin\' Somethin\'', duration: '6:03' },
          { title: 'Baby Be Mine', duration: '4:20' },
          { title: 'The Girl Is Mine', duration: '3:42' },
          { title: 'Thriller', duration: '5:57' },
          { title: 'Beat It', duration: '4:18' },
          { title: 'Billie Jean', duration: '4:54' },
          { title: 'Human Nature', duration: '4:06' },
          { title: 'P.Y.T. (Pretty Young Thing)', duration: '3:59' },
          { title: 'The Lady in My Life', duration: '4:59' }
        ]
      },
      {
        title: 'Abbey Road',
        artist: 'The Beatles',
        description: 'The Beatles\' penultimate album features a legendary medley on side two and some of their most sophisticated songwriting. Recorded at Abbey Road Studios with innovative techniques.',
        release_year: 1969,
        genre: 'Rock',
        image_url: 'https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg',
        tracks: [
          { title: 'Come Together', duration: '4:20' },
          { title: 'Something', duration: '3:03' },
          { title: 'Maxwell\'s Silver Hammer', duration: '3:27' },
          { title: 'Oh! Darling', duration: '3:26' },
          { title: 'Octopus\'s Garden', duration: '2:51' },
          { title: 'I Want You (She\'s So Heavy)', duration: '7:47' },
          { title: 'Here Comes the Sun', duration: '3:05' },
          { title: 'Because', duration: '2:45' },
          { title: 'You Never Give Me Your Money', duration: '4:02' },
          { title: 'Sun King', duration: '2:26' },
          { title: 'Mean Mr. Mustard', duration: '1:06' },
          { title: 'Polythene Pam', duration: '1:12' },
          { title: 'She Came in Through the Bathroom Window', duration: '1:57' },
          { title: 'Golden Slumbers', duration: '1:31' },
          { title: 'Carry That Weight', duration: '1:36' },
          { title: 'The End', duration: '2:19' },
          { title: 'Her Majesty', duration: '0:23' }
        ]
      },
      {
        title: 'Rumours',
        artist: 'Fleetwood Mac',
        description: 'A masterpiece born from interpersonal turmoil, featuring impeccable harmonies and production. Chronicles the romantic breakups within the band with raw emotional honesty.',
        release_year: 1977,
        genre: 'Rock',
        image_url: 'https://upload.wikimedia.org/wikipedia/en/f/fb/FMacRumours.PNG',
        tracks: [
          { title: 'Second Hand News', duration: '2:43' },
          { title: 'Dreams', duration: '4:14' },
          { title: 'Never Going Back Again', duration: '2:02' },
          { title: 'Don\'t Stop', duration: '3:11' },
          { title: 'Go Your Own Way', duration: '3:38' },
          { title: 'Songbird', duration: '3:20' },
          { title: 'The Chain', duration: '4:28' },
          { title: 'You Make Loving Fun', duration: '3:31' },
          { title: 'I Don\'t Want to Know', duration: '3:11' },
          { title: 'Oh Daddy', duration: '3:54' },
          { title: 'Gold Dust Woman', duration: '4:51' }
        ]
      },
      {
        title: 'Back in Black',
        artist: 'AC/DC',
        description: 'A tribute to former lead singer Bon Scott, this album became one of the best-selling rock albums ever. Features Brian Johnson\'s debut and massive guitar riffs.',
        release_year: 1980,
        genre: 'Hard Rock',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/92/ACDC_Back_in_Black.JPG',
        tracks: [
          { title: 'Hells Bells', duration: '5:12' },
          { title: 'Shoot to Thrill', duration: '5:17' },
          { title: 'What Do You Do for Money Honey', duration: '3:35' },
          { title: 'Given the Dog a Bone', duration: '3:31' },
          { title: 'Let Me Put My Love into You', duration: '4:15' },
          { title: 'Back in Black', duration: '4:15' },
          { title: 'You Shook Me All Night Long', duration: '3:30' },
          { title: 'Have a Drink on Me', duration: '3:58' },
          { title: 'Shake a Leg', duration: '4:05' },
          { title: 'Rock and Roll Ain\'t Noise Pollution', duration: '4:15' }
        ]
      },
      {
        title: 'The Miseducation of Lauryn Hill',
        artist: 'Lauryn Hill',
        description: 'A groundbreaking fusion of hip-hop, R&B, and soul exploring themes of love, motherhood, and spirituality. Won five Grammy Awards including Album of the Year.',
        release_year: 1998,
        genre: 'Hip-Hop/Soul',
        image_url: 'https://upload.wikimedia.org/wikipedia/en/5/5f/Lauryn_Hill_-_The_Miseducation_of_Lauryn_Hill.png',
        tracks: [
          { title: 'Intro', duration: '0:47' },
          { title: 'Lost Ones', duration: '5:33' },
          { title: 'Ex-Factor', duration: '5:26' },
          { title: 'To Zion', duration: '6:09' },
          { title: 'Doo Wop (That Thing)', duration: '5:20' },
          { title: 'Superstar', duration: '4:56' },
          { title: 'Final Hour', duration: '3:52' },
          { title: 'When It Hurts So Bad', duration: '5:39' },
          { title: 'I Used to Love Him', duration: '4:34' },
          { title: 'Forgive Them Father', duration: '5:16' },
          { title: 'Every Ghetto, Every City', duration: '4:25' },
          { title: 'Nothing Even Matters', duration: '5:48' },
          { title: 'Everything Is Everything', duration: '5:00' },
          { title: 'The Miseducation of Lauryn Hill', duration: '3:46' },
          { title: 'Can\'t Take My Eyes Off of You', duration: '4:32' }
        ]
      },
      {
        title: 'Kind of Blue',
        artist: 'Miles Davis',
        description: 'The best-selling jazz album of all time, featuring modal jazz improvisation. Recorded in just two sessions with an all-star lineup including John Coltrane and Bill Evans.',
        release_year: 1959,
        genre: 'Jazz',
        image_url: 'https://upload.wikimedia.org/wikipedia/en/9/9c/MilesDavisKindofBlue.jpg',
        tracks: [
          { title: 'So What', duration: '9:22' },
          { title: 'Freddie Freeloader', duration: '9:46' },
          { title: 'Blue in Green', duration: '5:37' },
          { title: 'All Blues', duration: '11:33' },
          { title: 'Flamenco Sketches', duration: '9:26' }
        ]
      },
      {
        title: 'Random Access Memories',
        artist: 'Daft Punk',
        description: 'A departure from electronic music, featuring live instrumentation and collaborations. Celebrates the sounds of the 70s and 80s with modern production.',
        release_year: 2013,
        genre: 'Electronic/Disco',
        image_url: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg',
        tracks: [
          { title: 'Give Life Back to Music', duration: '4:35' },
          { title: 'The Game of Love', duration: '5:22' },
          { title: 'Giorgio by Moroder', duration: '9:04' },
          { title: 'Within', duration: '3:48' },
          { title: 'Instant Crush', duration: '5:37' },
          { title: 'Lose Yourself to Dance', duration: '5:53' },
          { title: 'Touch', duration: '8:18' },
          { title: 'Get Lucky', duration: '6:09' },
          { title: 'Beyond', duration: '4:50' },
          { title: 'Motherboard', duration: '5:41' },
          { title: 'Fragments of Time', duration: '4:39' },
          { title: 'Doin\' It Right', duration: '4:11' },
          { title: 'Contact', duration: '6:21' }
        ]
      },
      {
        title: 'good kid, m.A.A.d city',
        artist: 'Kendrick Lamar',
        description: 'A cinematic concept album depicting Kendrick\'s experiences growing up in Compton. Features narrative storytelling with voicemails and skits connecting the tracks.',
        release_year: 2012,
        genre: 'Hip-Hop',
        image_url: 'https://upload.wikimedia.org/wikipedia/en/c/c6/Good_kid_mAAd_city.jpg',
        tracks: [
          { title: 'Sherane a.k.a Master Splinter\'s Daughter', duration: '4:33' },
          { title: 'Bitch, Don\'t Kill My Vibe', duration: '5:10' },
          { title: 'Backseat Freestyle', duration: '3:32' },
          { title: 'The Art of Peer Pressure', duration: '5:24' },
          { title: 'Money Trees', duration: '6:26' },
          { title: 'Poetic Justice', duration: '5:00' },
          { title: 'good kid', duration: '3:34' },
          { title: 'm.A.A.d city', duration: '5:50' },
          { title: 'Swimming Pools (Drank)', duration: '5:13' },
          { title: 'Sing About Me, I\'m Dying of Thirst', duration: '12:03' },
          { title: 'The Recipe', duration: '5:45' },
          { title: 'Compton', duration: '4:08' }
        ]
      },
      {
        title: '21',
        artist: 'Adele',
        description: 'A powerful breakup album featuring Adele\'s stunning vocals and emotional depth. Dominated charts worldwide and won six Grammy Awards including Album of the Year.',
        release_year: 2011,
        genre: 'Pop/Soul',
        image_url: 'https://upload.wikimedia.org/wikipedia/en/1/1b/Adele_-_21.png',
        tracks: [
          { title: 'Rolling in the Deep', duration: '3:48' },
          { title: 'Rumour Has It', duration: '3:43' },
          { title: 'Turning Tables', duration: '4:10' },
          { title: 'Don\'t You Remember', duration: '3:03' },
          { title: 'Set Fire to the Rain', duration: '4:01' },
          { title: 'He Won\'t Go', duration: '4:37' },
          { title: 'Take It All', duration: '3:48' },
          { title: 'I\'ll Be Waiting', duration: '4:01' },
          { title: 'One and Only', duration: '5:48' },
          { title: 'Lovesong', duration: '5:16' },
          { title: 'Someone Like You', duration: '4:45' }
        ]
      }
    ];

    console.log('\n📀 Adding 10 new albums with tracks...\n');

    // Keep track of created artists to avoid duplicates
    const artistMap = new Map();

    for (const album of albums) {
      // Create or get artist
      let artistId;
      if (artistMap.has(album.artist)) {
        artistId = artistMap.get(album.artist);
      } else {
        const artistResult = await client.query(
          `INSERT INTO artists (name, bio, image_url) 
           VALUES ($1, $2, $3) RETURNING artist_id`,
          [album.artist, `Biography for ${album.artist}`, album.image_url]
        );
        artistId = artistResult.rows[0].artist_id;
        artistMap.set(album.artist, artistId);
      }

      // Insert album
      const albumResult = await client.query(
        `INSERT INTO albums (title, artist_id, description, release_year, genre, image_url) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING album_id`,
        [album.title, artistId, album.description, album.release_year, album.genre, album.image_url]
      );

      const albumId = albumResult.rows[0].album_id;
      console.log(`✅ Added: "${album.title}" by ${album.artist} (${album.release_year})`);

      // Insert tracks for this album
      for (let i = 0; i < album.tracks.length; i++) {
        const track = album.tracks[i];
        await client.query(
          `INSERT INTO tracks (album_id, track_number, title, duration) 
           VALUES ($1, $2, $3, $4)`,
          [albumId, i + 1, track.title, track.duration]
        );
      }
      console.log(`   📝 Added ${album.tracks.length} tracks`);
    }

    console.log('\n✨ Database reset complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Albums: 10`);
    console.log(`   - Total tracks: ${albums.reduce((sum, a) => sum + a.tracks.length, 0)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
resetAndPopulate()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
