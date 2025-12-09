import React, { useState, useEffect } from 'react';
import ReviewCard from '../components/ReviewCard';
import { fetchAPI } from '../utils/api';

function AlbumDetailPage({ album, isLoggedIn, username, appState, onBack }) {
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({ rating: 0, reviewText: '' });
  const [newReview, setNewReview] = useState({ rating: 0, reviewText: '' });
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewsCollapsed, setReviewsCollapsed] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [album.album_id]);

  const fetchReviews = async () => {
    try {
      const response = await fetchAPI(`/api/reviews/albums/${album.album_id}/reviews`);
      const data = response.ok ? response.data : {};
      
      if (data.reviews && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        setAverageRating(data.averageRating || 0);
        
        // Filter for valid ratings
        const validRatings = data.reviews.filter(r => !r.is_flagged && r.rating > 0);
        setReviewCount(validRatings.length);

        // Find user's review
        const userReview = data.reviews.find(r => r.username === username);
        if (userReview) {
          setMyReview(userReview);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) {
      alert('Please log in to submit a review');
      return;
    }
    if (newReview.rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      const response = await fetchAPI('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          albumId: album.album_id,
          rating: newReview.rating,
          reviewText: newReview.reviewText
        })
      });

      if (response.ok) {
        setNewReview({ rating: 0, reviewText: '' });
        fetchReviews();
        appState.fetchTopAlbums();
        alert('Review submitted successfully!');
      } else {
        alert(response.error || 'Error submitting review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    }
  };

  const handleEditReview = async () => {
    try {
      await fetchAPI(`/api/reviews/${myReview.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          rating: editingData.rating,
          review_text: editingData.reviewText
        })
      });
      setIsEditing(false);
      fetchReviews();
      appState.fetchTopAlbums();
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Error updating review');
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await fetchAPI(`/api/reviews/${myReview.id}`, {
        method: 'DELETE'
      });
      setMyReview(null);
      fetchReviews();
      appState.fetchTopAlbums();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error deleting review');
    }
  };

  const handleFlagReview = async (reviewId) => {
    try {
      await fetchAPI(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ flagged: true })
      });
      fetchReviews();
    } catch (error) {
      console.error('Error flagging review:', error);
      alert('Error flagging review');
    }
  };

  const handleUnflagReview = async (reviewId) => {
    try {
      await fetchAPI(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ flagged: false })
      });
      fetchReviews();
    } catch (error) {
      console.error('Error unflagging review:', error);
      alert('Error unflagging review');
    }
  };

  return (
    <div className="page-container album-detail">
      <button onClick={onBack} className="back-button">← Back to Albums</button>
      
      <div className="album-header">
        {album.image_url && (
          <img src={album.image_url} alt={album.title} className="album-image-large" />
        )}
        <div className="album-info">
          <h1>{album.title}</h1>
          <p className="artist-name">{album.artist_name}</p>
          <p className="album-meta">
            <span><strong>Genre:</strong> {album.genre}</span>
            <span><strong>Year:</strong> {album.release_year}</span>
          </p>
          {averageRating > 0 && (
            <p className="rating-info">
              Rating: {averageRating.toFixed(2)} ★ ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}
          {album.description && (
            <p className="description">{album.description}</p>
          )}
          {album.video_url && (
            <a href={album.video_url} target="_blank" rel="noopener noreferrer" className="youtube-link">
              ▶ Watch on YouTube
            </a>
          )}
        </div>
      </div>

      {isLoggedIn && (
        <div className="review-form-section">
          <h2>
            {myReview ? (
              isEditing ? 'Edit Your Review' : 'Your Review'
            ) : (
              'Add Your Review'
            )}
          </h2>

          {myReview && !isEditing ? (
            <ReviewCard
              review={myReview}
              isEditing={false}
              editingData={editingData}
              onEdit={() => {
                setIsEditing(true);
                setEditingData({ rating: myReview.rating, reviewText: myReview.review_text || '' });
              }}
              onSave={handleEditReview}
              onCancel={() => setIsEditing(false)}
              onDelete={handleDeleteReview}
              onFlag={handleFlagReview}
              onUnflag={handleUnflagReview}
              isMyReview={true}
              isFlagged={myReview.flagged}
              canUnflag={false}
            />
          ) : myReview && isEditing ? (
            <ReviewCard
              review={myReview}
              isEditing={true}
              editingData={editingData}
              onEdit={() => {}}
              onSave={handleEditReview}
              onCancel={() => setIsEditing(false)}
              onDelete={handleDeleteReview}
              onFlag={handleFlagReview}
              onUnflag={handleUnflagReview}
              isMyReview={true}
              isFlagged={myReview.flagged}
              canUnflag={false}
              onRatingChange={(rating) => setEditingData({ ...editingData, rating })}
              onTextChange={(text) => setEditingData({ ...editingData, reviewText: text })}
            />
          ) : (
            <div className="review-form">
              <div className="rating-selector">
                <label>Rating:</label>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`star ${star <= newReview.rating ? 'filled' : ''}`}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Write your review..."
                value={newReview.reviewText}
                onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })}
                rows="4"
              />
              <button onClick={handleSubmitReview} className="submit-button">
                Submit Review
              </button>
            </div>
          )}
        </div>
      )}

      <div className="reviews-section">
        <h2 
          onClick={() => setReviewsCollapsed(!reviewsCollapsed)}
          className={reviewsCollapsed ? 'collapsed' : ''}
        >
          All Reviews
        </h2>
        <div className={`reviews-list ${reviewsCollapsed ? 'collapsed' : ''}`}>
          {reviews && reviews.length > 0 ? (
            reviews.map(review => (
              review.username !== username && (
                <ReviewCard
                  key={review.review_id}
                  review={review}
                  isEditing={false}
                  editingData={{}}
                  onEdit={() => {}}
                  onSave={() => {}}
                  onCancel={() => {}}
                  onDelete={() => {}}
                  onFlag={handleFlagReview}
                  onUnflag={handleUnflagReview}
                  isMyReview={false}
                  isFlagged={review.is_flagged}
                  canUnflag={false}
                />
              )
            ))
          ) : (
            <p>No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlbumDetailPage;
