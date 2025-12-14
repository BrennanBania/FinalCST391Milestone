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
    console.log('Starting edit for review:', review);
    console.log('Review text:', review.review_text);
    const initialText = review.review_text || '';
    const initialRating = review.rating || 5;
    console.log('Setting editingData:', { rating: initialRating, reviewText: initialText });
    setEditingId(review.review_id);
    setEditingData({ 
      rating: initialRating, 
      reviewText: initialText
    });
  };

  const handleEditSave = async (reviewId) => {
    console.log('Saving review with data:', editingData);
    if (!editingData.rating || editingData.rating < 1 || editingData.rating > 5) {
      alert('Please select a valid rating (1-5)');
      return;
    }
    
    try {
      const response = await fetchAPI(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify({
          rating: editingData.rating,
          review_text: editingData.reviewText || ''
        })
      });
      
      if (response.ok) {
        setEditingId(null);
        setEditingData({ rating: 0, reviewText: '' });
        // Refresh data to show updated review
        await appState.fetchMyReviews();
        await appState.fetchTopAlbums(true);
        await appState.fetchAlbums(true);
        alert('Review updated successfully!');
      } else {
        alert(response.error || 'Error updating review');
      }
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
      appState.fetchTopAlbums(true);
      appState.fetchAlbums(true);
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
      appState.fetchTopAlbums(true);
      appState.fetchAlbums(true);
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
      appState.fetchTopAlbums(true);
      appState.fetchAlbums(true);
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
              key={review.review_id}
              review={review}
              isEditing={editingId === review.review_id}
              editingData={editingData}
              onEdit={() => handleEditStart(review)}
              onSave={() => handleEditSave(review.review_id)}
              onCancel={() => setEditingId(null)}
              onDelete={() => handleDelete(review.review_id)}
              onFlag={handleFlagReview}
              onUnflag={handleUnflagReview}
              isMyReview={true}
              isFlagged={review.is_flagged}
              canUnflag={false}
              onRatingChange={(rating) => {
                console.log('Rating changed to:', rating);
                setEditingData({ ...editingData, rating });
              }}
              onTextChange={(text) => {
                console.log('Text changed to:', text);
                setEditingData({ ...editingData, reviewText: text });
              }}
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
