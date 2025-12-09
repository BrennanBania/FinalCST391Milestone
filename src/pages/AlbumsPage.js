import React, { useState } from 'react';
import AlbumCard from '../components/AlbumCard';

function AlbumsPage({ albums, isLoggedIn, isAdmin, onViewAlbum, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');

  const filteredAlbums = albums.filter(album => {
    const matchesSearch = album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         album.artist_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !filterGenre || album.genre === filterGenre;
    return matchesSearch && matchesGenre;
  });

  const genres = [...new Set(albums.map(a => a.genre))].sort();

  return (
    <div className="page-container">
      {!isLoggedIn && (
        <div className="login-prompt">
          <p>Please log in to access full features including reviews and personalized collections.</p>
        </div>
      )}
      <div className="page-header-with-action">
        <h1>Albums</h1>
        {isLoggedIn && !isAdmin && (
          <button onClick={() => onNavigate('request-album')} className="request-album-btn">
            Request New Album
          </button>
        )}
      </div>
      
      <div className="filters">
        <input
          type="text"
          placeholder="Search albums or artists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterGenre}
          onChange={(e) => setFilterGenre(e.target.value)}
          className="genre-filter"
        >
          <option value="">All Genres</option>
          {genres.map(genre => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </div>

      <div className="albums-grid">
        {filteredAlbums.length > 0 ? (
          filteredAlbums.map(album => (
            <AlbumCard
              key={album.album_id}
              album={album}
              onView={() => onViewAlbum(album)}
              showViewButton={isLoggedIn}
            />
          ))
        ) : (
          <p>No albums found</p>
        )}
      </div>
    </div>
  );
}

export default AlbumsPage;
