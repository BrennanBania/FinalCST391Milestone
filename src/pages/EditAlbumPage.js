import React, { useState } from 'react';
import { fetchAPI } from '../utils/api';

function EditAlbumPage({ appState, onNavigate }) {
  const [title, setTitle] = useState('');
  const [artist_name, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [release_year, setReleaseYear] = useState('');
  const [description, setDescription] = useState('');
  const [image_url, setImageUrl] = useState('');
  const [video_url, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetchAPI('/api/albums', {
        method: 'POST',
        body: JSON.stringify({
          title,
          artist_name,
          genre,
          release_year: parseInt(release_year),
          description,
          image_url,
          video_url
        })
      });

      if (response.ok) {
        appState.fetchAlbums();
        setTitle('');
        setArtistName('');
        setGenre('');
        setReleaseYear('');
        setDescription('');
        setImageUrl('');
        setVideoUrl('');
        onNavigate('albums');
      } else {
        setError(response.error || 'Error creating album');
      }
    } catch (error) {
      setError(error.message || 'Error creating album');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container edit-album-page">
      <h1>Add New Album</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="album-form">
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Artist:</label>
          <input
            type="text"
            value={artist_name}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Artist Name"
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
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Album description (optional)"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label>Image URL:</label>
          <input
            type="url"
            value={image_url}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="form-group">
          <label>Video URL:</label>
          <input
            type="url"
            value={video_url}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Creating...' : 'Create Album'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('albums')}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditAlbumPage;
