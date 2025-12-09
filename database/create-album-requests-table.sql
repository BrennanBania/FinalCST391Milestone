-- Create album_requests table for user requests
CREATE TABLE IF NOT EXISTS album_requests (
  request_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist_id INTEGER REFERENCES artists(artist_id),
  release_year INTEGER,
  genre VARCHAR(100),
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  requested_by INTEGER REFERENCES users(user_id) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(user_id)
);

-- Create index for faster queries
CREATE INDEX idx_album_requests_status ON album_requests(status);
CREATE INDEX idx_album_requests_user ON album_requests(requested_by);
