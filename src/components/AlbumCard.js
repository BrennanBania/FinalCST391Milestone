import React from 'react';

const AlbumCard = React.memo(({ album, onView, showViewButton = true }) => {
  return (
    <div className="album-card">
      <img
        src={album.image_url}
        alt={album.title}
        onError={(e) => (e.target.style.display = 'none')}
        loading="lazy"
      />
      <h3>{album.title}</h3>
      <p>{album.artist_name}</p>
      <p className="genre">{album.genre}</p>
      <p className="year">{album.release_year}</p>
      {album.review_count > 0 && (
        <p className="rating">Rating: {parseFloat(album.avg_rating).toFixed(2)}</p>
      )}
      {album.review_count === 0 && <p className="rating">No ratings yet</p>}
      {showViewButton && (
        <button onClick={() => onView(album)} className="view-btn">
          View
        </button>
      )}
    </div>
  );
});

AlbumCard.displayName = 'AlbumCard';

export default AlbumCard;
