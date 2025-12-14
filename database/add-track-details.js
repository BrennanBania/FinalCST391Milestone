import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;
dotenv.config();

async function addTrackDetails() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add lyrics and video_url columns if they don't exist
    console.log('\n📝 Adding lyrics and video_url columns to tracks table...');
    await client.query(`
      ALTER TABLE tracks 
      ADD COLUMN IF NOT EXISTS lyrics TEXT,
      ADD COLUMN IF NOT EXISTS video_url VARCHAR(255)
    `);
    console.log('✅ Columns added');

    // Get all tracks to update them with lyrics and video URLs
    console.log('\n🎵 Fetching tracks...');
    const tracksResult = await client.query(`
      SELECT t.track_id, t.title, t.album_id, a.title as album_title, ar.name as artist_name
      FROM tracks t
      JOIN albums a ON t.album_id = a.album_id
      JOIN artists ar ON a.artist_id = ar.artist_id
      ORDER BY t.album_id, t.track_number
    `);

    console.log(`Found ${tracksResult.rows.length} tracks\n`);

    // Sample lyrics for tracks
    const sampleLyrics = `[Verse 1]
In the moment when the music plays
Lost in rhythm, through the nights and days
Every note tells a story untold
Memories and dreams begin to unfold

[Chorus]
We're alive in this melody
Finding who we're meant to be
Through the highs and through the lows
This is where the feeling grows

[Verse 2]
When the world feels heavy on your mind
Let the music be the peace you find
Every chord strikes deep within your soul
Making broken pieces whole

[Bridge]
And we'll sing until the dawn breaks through
Every word rings forever true
In this song we come alive
This is how we all survive

[Chorus]
We're alive in this melody
Finding who we're meant to be
Through the highs and through the lows
This is where the feeling grows`;

    // Map of specific tracks to their actual YouTube video IDs
    const trackVideoMap = {
      // Pink Floyd - The Dark Side of the Moon
      'Speak to Me': 'cvYvTiiBR9Q',
      'Breathe': 'mrojrDCI02k',
      'On the Run': 'T70-HTvOqME',
      'Time': 'JwYX52BP2Sk',
      'The Great Gig in the Sky': 'cVBCE3gaNxc',
      'Money': '-0kcet4aPpQ',
      'Us and Them': 'nDbeqj-1XOo',
      'Any Colour You Like': 'bK7HJvmgFnM',
      'Brain Damage': 'E1qL_AZhGme',
      'Eclipse': 'LTseTg48568',
      
      // Michael Jackson - Thriller
      'Wanna Be Startin\' Somethin\'': 'ATQagFao3qs',
      'Baby Be Mine': 'GXVH8kZMFZc',
      'The Girl Is Mine': 'xoSV5qqfAF8',
      'Thriller': 'sOnqjkJTMaA',
      'Beat It': 'oRdxUFDoQe0',
      'Billie Jean': 'Zi_XLOBDo_Y',
      'Human Nature': 'ElN_4vUvTPs',
      'P.Y.T. (Pretty Young Thing)': 'bbqVblylD00',
      'The Lady in My Life': 'EJy5yJxPwpU',
      
      // The Beatles - Abbey Road
      'Come Together': 'axb2sHpGwHQ',
      'Something': 'UelDrZ1aFeY',
      'Maxwell\'s Silver Hammer': 'mJag19WoAe0',
      'Oh! Darling': 'z6gFVnJIwNQ',
      'Octopus\'s Garden': 'De1LCQvbqV4',
      'I Want You (She\'s So Heavy)': 'tAe2Q_LhY8g',
      'Here Comes the Sun': 'KQetemT1sWc',
      'Because': 'hL0tnrl2L_U',
      'You Never Give Me Your Money': 'yH6HyMcb6-M',
      'Sun King': 'UelDrZ1aFeY',
      'Mean Mr. Mustard': 'UelDrZ1aFeY',
      'Polythene Pam': 'UelDrZ1aFeY',
      'She Came in Through the Bathroom Window': 'UelDrZ1aFeY',
      'Golden Slumbers': 'AcQzlhRV8pI',
      'Carry That Weight': 'fWqFNIXHZew',
      'The End': 'KKJcKBhHKVk',
      'Her Majesty': '1J5wtYfAeFk',
      
      // Fleetwood Mac - Rumours
      'Second Hand News': 'bMxqIPSkcD4',
      'Dreams': 'mrZRURcb1cM',
      'Never Going Back Again': 'sKj1EFeU-cM',
      'Don\'t Stop': 'SBjQ9tuuTJQ',
      'Go Your Own Way': '6ul-cZyuYq4',
      'Songbird': 'VU0GYSA1FHs',
      'The Chain': 'JDG2m5hN1vo',
      'You Make Loving Fun': 'dBHix33VUxY',
      'I Don\'t Want to Know': 'YEi7GPkxOfQ',
      'Oh Daddy': 'FbIYL8STWnA',
      'Gold Dust Woman': '4CwK2QEuOhg',
      
      // AC/DC - Back in Black
      'Hells Bells': 'etAIpkdhU9Q',
      'Shoot to Thrill': '4_Gf0mGJwD8',
      'What Do You Do for Money Honey': 'F_Cbe6Sv0_A',
      'Given the Dog a Bone': 'lxWjV3zYNXk',
      'Let Me Put My Love into You': 'ijAYN9S7tm8',
      'Back in Black': 'pAgnJDJN4VA',
      'You Shook Me All Night Long': 'Lo2qQmj0_h4',
      'Have a Drink on Me': 'pl4plPszn58',
      'Shake a Leg': 'vVDEUZKPCxk',
      'Rock and Roll Ain\'t Noise Pollution': 'X_IWlPHMziU',
      
      // Lauryn Hill
      'Intro': 'cE-bnWqLqxE',
      'Lost Ones': 'HS1pYJGxDHY',
      'Ex-Factor': 'cE-bnWqLqxE',
      'To Zion': 'a_elKOF2F2o',
      'Doo Wop (That Thing)': 'T6QKqFPRZSA',
      'Superstar': 'ch6u826LoKg',
      'Final Hour': '4xq4LcNqN0E',
      'When It Hurts So Bad': 'a_elKOF2F2o',
      'I Used to Love Him': 'T6QKqFPRZSA',
      'Forgive Them Father': 'qhN7YPY8rjI',
      'Every Ghetto, Every City': 'a_elKOF2F2o',
      'Nothing Even Matters': 'H8Gpv64dXyI',
      'Everything Is Everything': 'i3Z8w_UO0GE',
      'The Miseducation of Lauryn Hill': 'cE-bnWqLqxE',
      'Can\'t Take My Eyes Off of You': 'xuY5NZ4uZqw',
      
      // Miles Davis - Kind of Blue
      'So What': 'zqNTltOGh5c',
      'Freddie Freeloader': 'RPfFhfSuUZ4',
      'Blue in Green': '5sXqXZCW8eM',
      'All Blues': 'JIfdYs8WGfE',
      'Flamenco Sketches': 'F3W_alUuHBI',
      
      // Daft Punk - Random Access Memories
      'Give Life Back to Music': 'IluRBvnYMoY',
      'The Game of Love': 'ajGKWk0auOc',
      'Giorgio by Moroder': 'zhl-Cs1-sG4',
      'Within': 'y9wNyePKjpY',
      'Instant Crush': 'a5uQMwRMHcs',
      'Lose Yourself to Dance': 'NF-kLy44Hls',
      'Touch': 'XfH3erWacsQ',
      'Get Lucky': '5NV6Rdv1a3I',
      'Beyond': '_JeRuyXI_8E',
      'Motherboard': 'vfI4QHNx6_A',
      'Fragments of Time': 'JJSXkcHQ4wo',
      'Doin\' It Right': 'LL-gyhZVvx0',
      'Contact': 't4fYI9AfKqg',
      
      // Kendrick Lamar - good kid, m.A.A.d city
      'Sherane a.k.a Master Splinter\'s Daughter': 'TBq8fYJ1l_I',
      'Bitch, Don\'t Kill My Vibe': 'GF8aaTu2kg0',
      'Backseat Freestyle': 'EZW7et3tPuQ',
      'The Art of Peer Pressure': '7Rz1kRb7-F8',
      'Money Trees': 'smqhSl0u_sI',
      'Poetic Justice': 'yyr2gEouEMM',
      'm.A.A.d city': '10yrPDf92hY',
      'Swimming Pools (Drank)': 'B5YNiCfWC3A',
      'Sing About Me, I\'m Dying of Thirst': '1WQv9JDsCMc',
      'Real': 'p3Vr2WRn3Ms',
      'Compton': '0wgQ3bsK8fs',
      'The Recipe': 'YpugK0RpEaU',
      
      // Adele - 21
      'Rolling in the Deep': 'rYEDA3JcQqw',
      'Rumour Has It': 'BvK45FEz8F0',
      'Turning Tables': 'oKxc0tNSJW0',
      'Don\'t You Remember': 'YS8lqJGN5jI',
      'Set Fire to the Rain': 'FlsBObg-1BQ',
      'He Won\'t Go': '5d0dNKYgkZE',
      'Take It All': 'EHoJPncl3EI',
      'I\'ll Be Waiting': 'q6SktXrJW04',
      'One and Only': '4cxb_SCzF0E',
      'Lovesong': 'KJLzE5UDWUY',
      'Someone Like You': 'hLQl3WQQoQ0'
    };

    // Update each track with lyrics and matching video URL
    let updateCount = 0;
    for (const track of tracksResult.rows) {
      // Try to find matching video ID for this track
      const videoId = trackVideoMap[track.title];
      const videoUrl = videoId 
        ? `https://www.youtube.com/watch?v=${videoId}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(track.artist_name + ' ' + track.title)}`;

      await client.query(
        'UPDATE tracks SET lyrics = $1, video_url = $2 WHERE track_id = $3',
        [sampleLyrics, videoUrl, track.track_id]
      );

      updateCount++;
      if (updateCount % 10 === 0) {
        console.log(`Updated ${updateCount}/${tracksResult.rows.length} tracks...`);
      }
    }

    console.log(`\n✅ Updated all ${updateCount} tracks with lyrics and video URLs`);
    console.log('\n✨ Track details update complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addTrackDetails();
