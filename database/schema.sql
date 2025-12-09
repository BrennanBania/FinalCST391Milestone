-- Music Collection Database Schema
-- PostgreSQL 14+

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS user_collections CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS albums CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Artists table
CREATE TABLE artists (
    artist_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bio TEXT,
    country VARCHAR(50),
    formed_year INTEGER,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Albums table
CREATE TABLE albums (
    album_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    artist_id INTEGER NOT NULL REFERENCES artists(artist_id) ON DELETE CASCADE,
    release_year INTEGER,
    genre VARCHAR(50),
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Tracks table
CREATE TABLE tracks (
    track_id SERIAL PRIMARY KEY,
    album_id INTEGER NOT NULL REFERENCES albums(album_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    duration_seconds INTEGER,
    track_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create User Collections table (many-to-many relationship)
CREATE TABLE user_collections (
    collection_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    album_id INTEGER NOT NULL REFERENCES albums(album_id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, album_id)
);

-- Create Reviews table
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    album_id INTEGER NOT NULL REFERENCES albums(album_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, album_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_albums_artist ON albums(artist_id);
CREATE INDEX idx_albums_genre ON albums(genre);
CREATE INDEX idx_tracks_album ON tracks(album_id);
CREATE INDEX idx_collections_user ON user_collections(user_id);
CREATE INDEX idx_collections_album ON user_collections(album_id);
CREATE INDEX idx_reviews_album ON reviews(album_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing

-- Sample Artists
INSERT INTO artists (name, bio, country, formed_year, image_url) VALUES
('The Beatles', 'English rock band formed in Liverpool in 1960, regarded as the most influential band of all time.', 'United Kingdom', 1960, 'https://via.placeholder.com/150'),
('Pink Floyd', 'English rock band known for philosophical lyrics, sonic experimentation, and elaborate live shows.', 'United Kingdom', 1965, 'https://via.placeholder.com/150'),
('Michael Jackson', 'American singer, songwriter, and dancer, dubbed the "King of Pop".', 'United States', 1971, 'https://via.placeholder.com/150');

-- Sample Albums
INSERT INTO albums (title, artist_id, release_year, genre, description, image_url) VALUES
('Abbey Road', 1, 1969, 'Rock', 'The eleventh studio album by the Beatles, featuring the famous crossing photo and many classic tracks.', 'https://via.placeholder.com/150'),
('The Dark Side of the Moon', 2, 1973, 'Progressive Rock', 'Pink Floyd''s eighth album, exploring themes of conflict, greed, time, and mental illness.', 'https://via.placeholder.com/150'),
('Thriller', 3, 1982, 'Pop', 'Michael Jackson''s Thriller is the best-selling album of all time and a pop-culture landmark.', 'https://via.placeholder.com/150');

-- Sample Tracks for Abbey Road
INSERT INTO tracks (album_id, title, duration_seconds, track_number) VALUES
(1, 'Come Together', 259, 1),
(1, 'Something', 182, 2),
(1, 'Maxwell''s Silver Hammer', 207, 3),
(1, 'Oh! Darling', 206, 4),
(1, 'Here Comes the Sun', 185, 5);

-- Sample Tracks for Dark Side of the Moon
INSERT INTO tracks (album_id, title, duration_seconds, track_number) VALUES
(2, 'Speak to Me', 90, 1),
(2, 'Breathe', 163, 2),
(2, 'On the Run', 216, 3),
(2, 'Time', 413, 4),
(2, 'Money', 382, 5);

-- Sample Tracks for Thriller
INSERT INTO tracks (album_id, title, duration_seconds, track_number) VALUES
(3, 'Wanna Be Startin'' Somethin''', 363, 1),
(3, 'Baby Be Mine', 260, 2),
(3, 'The Girl Is Mine', 222, 3),
(3, 'Thriller', 357, 4),
(3, 'Beat It', 258, 5);

-- Sample Admin User (password: admin123)
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@music.com', '$2b$10$YourHashedPasswordHere', 'admin');

-- Sample Customer User (password: customer123)
INSERT INTO users (username, email, password_hash, role) VALUES
('musicfan', 'fan@music.com', '$2b$10$YourHashedPasswordHere', 'customer');
