import React from 'react';
import AlbumCard from '../components/AlbumCard';

function HomePage({ topAlbums, onViewAlbum, isLoggedIn }) {
  return (
    <div className="page-container">
      {!isLoggedIn && (
        <div className="login-prompt">
          <p>Please log in to access full features including reviews and personalized collections.</p>
        </div>
      )}
      <h1>Top Rated Albums</h1>
      <div className="albums-grid">
        {topAlbums && topAlbums.length > 0 ? (
          topAlbums.map(album => (
            <AlbumCard
              key={album.id}
              album={album}
              onView={() => onViewAlbum(album)}
              showViewButton={isLoggedIn}
            />
          ))
        ) : (
          <p>No rated albums yet</p>
        )}
      </div>
    </div>
  );
}

export default HomePage;
