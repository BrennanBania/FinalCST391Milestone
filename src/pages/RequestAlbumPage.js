import React, { useState } from 'react';
import { fetchAPI } from '../utils/api';

function RequestAlbumPage({ appState, onNavigate }) {
  const [title, setTitle] = useState('');
  const [artist_name, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [release_year, setReleaseYear] = useState('');
  const [image_url, setImageUrl] = useState('');
  const [video_url, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetchAPI('/api/album-requests', {
        method: 'POST',
        body: JSON.stringify({
          title,
          artist_name,
          genre,
          release_year: parseInt(release_year),
          image_url,
          video_url
        })
      });

      if (response.ok) {
        setSuccess('Album request submitted! An admin will review it soon.');
        setTitle('');
        setArtistName('');
        setGenre('');
        setReleaseYear('');
        setImageUrl('');
        setVideoUrl('');
        // Refresh album requests in app state
        if (appState && appState.fetchAlbumRequests) {
          await appState.fetchAlbumRequests();
        }
        if (onNavigate) {
          setTimeout(() => onNavigate('albums'), 2000);
        }
      } else {
        setError(response.error || 'Error submitting request');
      }
    } catch (error) {
      setError(error.message || 'Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container request-album-page">
      <h1>Request Album</h1>
      <p>Can't find an album? Request it and an admin will add it to the collection!</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="album-form">
        <div className="form-group">
          <label>Album Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Artist Name:</label>
          <input
            type="text"
            value={artist_name}
            onChange={(e) => setArtistName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Genre:</label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Release Year:</label>
          <input
            type="number"
            value={release_year}
            onChange={(e) => setReleaseYear(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Album Cover URL (optional):</label>
          <input
            type="url"
            value={image_url}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/album-cover.jpg"
          />
        </div>

        <div className="form-group">
          <label>Video URL (optional):</label>
          <input
            type="url"
            value={video_url}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default RequestAlbumPage;
