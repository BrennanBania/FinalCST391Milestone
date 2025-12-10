import React, { useState, useEffect, useRef } from 'react';
import ReviewCard from '../components/ReviewCard';
import { fetchAPI } from '../utils/api';

function MyReviewsPage({ reviews, appState }) {
  const [myReviews, setMyReviews] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({ rating: 0, reviewText: '' });
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      appState.fetchMyReviews();
    }
  }, []);

  useEffect(() => {
    setMyReviews(reviews || []);
  }, [reviews]);

  const handleEditStart = (review) => {
    setEditingId(review.id);
    setEditingData({ rating: review.rating, reviewText: review.review_text || '' });
  };

  const handleEditSave = async (reviewId) => {
    try {
      await fetchAPI(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify({
          rating: editingData.rating,
          review_text: editingData.reviewText
        })
      });
      setEditingId(null);
      appState.fetchMyReviews();
      appState.fetchTopAlbums();
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Error updating review');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await fetchAPI(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      appState.fetchMyReviews();
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
      appState.fetchMyReviews();
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
      appState.fetchMyReviews();
    } catch (error) {
      console.error('Error unflagging review:', error);
      alert('Error unflagging review');
    }
  };

  return (
    <div className="page-container">
      <h1>My Reviews</h1>
      <div className="reviews-list">
        {myReviews && myReviews.length > 0 ? (
          myReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              isEditing={editingId === review.id}
              editingData={editingData}
              onEdit={() => handleEditStart(review)}
              onSave={() => handleEditSave(review.id)}
              onCancel={() => setEditingId(null)}
              onDelete={() => handleDelete(review.id)}
              onFlag={handleFlagReview}
              onUnflag={handleUnflagReview}
              isMyReview={true}
              isFlagged={review.flagged}
              canUnflag={false}
              onRatingChange={(rating) => setEditingData({ ...editingData, rating })}
              onTextChange={(text) => setEditingData({ ...editingData, reviewText: text })}
            />
          ))
        ) : (
          <p>No reviews yet</p>
        )}
      </div>
    </div>
  );
}

export default MyReviewsPage;
