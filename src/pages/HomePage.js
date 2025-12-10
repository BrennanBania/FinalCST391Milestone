import React, { useState, useEffect } from 'react';
import AlbumCard from '../components/AlbumCard';
import ReviewCard from '../components/ReviewCard';
import { fetchAPI } from '../utils/api';

function HomePage({ topAlbums, onViewAlbum, isLoggedIn, username, albums = [] }) {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    // Load recently viewed from localStorage
    if (isLoggedIn && albums && albums.length > 0) {
      const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const viewedAlbums = viewed
        .map(id => albums.find(a => a.album_id === id))
        .filter(Boolean)
        .slice(0, 4);
      setRecentlyViewed(viewedAlbums);
    }

    // Fetch recent reviews
    fetchRecentReviews();

    // Get recommended albums (albums not in user's recently viewed)
    if (albums && albums.length > 0) {
      const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const notViewed = albums.filter(a => !viewed.includes(a.album_id));
      const shuffled = notViewed.sort(() => 0.5 - Math.random());
      setRecommended(shuffled.slice(0, 4));
    }
  }, [isLoggedIn, albums]);

  const fetchRecentReviews = async () => {
    try {
      const response = await fetchAPI('/api/reviews');
      if (response.ok && response.data) {
        const sorted = response.data
          .filter(r => !r.is_flagged)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 4);
        setRecentReviews(sorted);
      }
    } catch (error) {
      console.error('Error fetching recent reviews:', error);
    }
  };

  return (
    <div className="page-container">
      {!isLoggedIn && (
        <div className="login-prompt">
          <p>Please log in to access full features including reviews and personalized collections.</p>
        </div>
      )}

      <section className="home-section">
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
      </section>

      {isLoggedIn && recentlyViewed.length > 0 && (
        <section className="home-section">
          <h2>Your Recently Viewed</h2>
          <div className="albums-grid">
            {recentlyViewed.map(album => (
              <AlbumCard
                key={album.album_id}
                album={album}
                onView={() => onViewAlbum(album)}
                showViewButton={true}
              />
            ))}
          </div>
        </section>
      )}

      {isLoggedIn && recommended.length > 0 && (
        <section className="home-section">
          <h2>Recommended for You</h2>
          <div className="albums-grid">
            {recommended.map(album => (
              <AlbumCard
                key={album.album_id}
                album={album}
                onView={() => onViewAlbum(album)}
                showViewButton={true}
              />
            ))}
          </div>
        </section>
      )}

      {recentReviews.length > 0 && (
        <section className="home-section">
          <h2>Recent Reviews</h2>
          <div className="reviews-grid">
            {recentReviews.map(review => (
              <ReviewCard
                key={review.review_id}
                review={review}
                isEditing={false}
                editingData={{}}
                onEdit={() => {}}
                onSave={() => {}}
                onCancel={() => {}}
                onDelete={() => {}}
                onFlag={() => {}}
                onUnflag={() => {}}
                isFlagged={false}
                canUnflag={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;
