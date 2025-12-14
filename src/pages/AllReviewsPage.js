import React, { useState, useEffect, useRef } from 'react';
import ReviewCard from '../components/ReviewCard';

function AllReviewsPage({ reviews, isAdmin, username, appState }) {
  const [allReviews, setAllReviews] = useState([]);
  const [filterFlagged, setFilterFlagged] = useState('all'); // 'all', 'flagged', 'pending'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'rating-high', 'rating-low'
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      appState.fetchAllReviews();
    }
  }, []);

  useEffect(() => {
    setAllReviews(reviews || []);
  }, [reviews]);

  const filterReviews = () => {
    let filtered = allReviews;

    // Apply flag filter
    if (filterFlagged === 'flagged') {
      filtered = filtered.filter(r => r.is_flagged);
    } else if (filterFlagged === 'pending') {
      filtered = filtered.filter(r => !r.is_flagged);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.album_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.review_text && r.review_text.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    if (sortBy === 'rating-high') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'rating-low') {
      filtered = [...filtered].sort((a, b) => a.rating - b.rating);
    } else {
      // recent (default - newest first)
      filtered = [...filtered].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
    }

    return filtered;
  };

  const filteredReviews = filterReviews();

  const handleFlagReview = async (reviewId) => {
    try {
      await appState.fetchAPI(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ flagged: true })
      });
      appState.fetchAllReviews();
      appState.fetchTopAlbums(true);
      appState.fetchAlbums(true);
    } catch (error) {
      console.error('Error flagging review:', error);
      alert('Error flagging review');
    }
  };

  const handleUnflagReview = async (reviewId) => {
    try {
      await appState.fetchAPI(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ flagged: false })
      });
      appState.fetchAllReviews();
      appState.fetchTopAlbums(true);
      appState.fetchAlbums(true);
    } catch (error) {
      console.error('Error unflagging review:', error);
      alert('Error unflagging review');
    }
  };

  return (
    <div className="page-container">
      <h1>All Reviews</h1>

      <div className="reviews-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by album, artist, author, or review text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Status:</label>
            <select value={filterFlagged} onChange={(e) => setFilterFlagged(e.target.value)}>
              <option value="all">All Reviews</option>
              <option value="pending">Pending (Not Flagged)</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Most Recent</option>
              <option value="rating-high">Highest Rating</option>
              <option value="rating-low">Lowest Rating</option>
            </select>
          </div>
        </div>
      </div>

      <div className="reviews-stats">
        <p>Showing {filteredReviews.length} of {allReviews.length} reviews</p>
      </div>

      <div className="reviews-list">
        {filteredReviews && filteredReviews.length > 0 ? (
          filteredReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              isEditing={false}
              editingData={{}}
              onEdit={() => {}}
              onSave={() => {}}
              onCancel={() => {}}
              onDelete={() => {}}
              onFlag={handleFlagReview}
              onUnflag={handleUnflagReview}
              isMyReview={review.username === username}
              isFlagged={review.is_flagged}
              canUnflag={isAdmin}
            />
          ))
        ) : (
          <p className="no-results">No reviews found matching your filters.</p>
        )}
      </div>
    </div>
  );
}

export default AllReviewsPage;
