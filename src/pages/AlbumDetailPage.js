import React, { useState, useEffect, useCallback } from 'react';
import ReviewCard from '../components/ReviewCard';
import { fetchAPI } from '../utils/api';

function AlbumDetailPage({ album, tracks = [], isLoggedIn, username, appState, onBack }) {
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({ rating: 0, reviewText: '' });
  const [newReview, setNewReview] = useState({ rating: 0, reviewText: '' });
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewsCollapsed, setReviewsCollapsed] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const handleTrackClick = async (track) => {
    console.log('Selected track:', track);
    
    // If clicking the same track, collapse it
    if (track.track_id === selectedTrack?.track_id) {
      setSelectedTrack(null);
      return;
    }
    
    // Fetch full track details including lyrics
    try {
      const response = await fetchAPI(`/api/tracks/${track.track_id}`);
      if (response.ok && response.data) {
        console.log('Full track data:', response.data);
        setSelectedTrack(response.data);
      } else {
        // Fallback to track without lyrics
        setSelectedTrack(track);
      }
    } catch (error) {
      console.error('Error fetching track details:', error);
      // Fallback to track without lyrics
      setSelectedTrack(track);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    let videoId = null;
    
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    }
    // Short URL: https://youtu.be/VIDEO_ID
    else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetchAPI(`/api/albums/${album.album_id}/reviews`);
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
  }, [album.album_id, username]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

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
        appState.fetchTopAlbums(true);
        appState.fetchAlbums(true);
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
      appState.fetchTopAlbums(true);
      appState.fetchAlbums(true);
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
        </div>
      </div>

      {tracks && tracks.length > 0 && (
        <div className="tracks-layout">
          <div className="tracks-list-section">
            <h2>Track List</h2>
            <ol className="track-list">
              {tracks.map(track => (
                <li 
                  key={track.track_id} 
                  className={`track-item clickable ${selectedTrack?.track_id === track.track_id ? 'active' : ''}`}
                  onClick={() => handleTrackClick(track)}
                  title="Click to view video and lyrics"
                >
                  <span className="track-number">{track.track_number}.</span>
                  <span className="track-title">{track.title}</span>
                  {track.duration && (
                    <span className="track-duration">{track.duration}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {selectedTrack && (
            <div className="track-details-section">
              <div className="track-details-header">
                <h3>{selectedTrack.track_number}. {selectedTrack.title}</h3>
                {selectedTrack.duration && <span className="duration-badge">{selectedTrack.duration}</span>}
              </div>

              {selectedTrack.video_url && getYouTubeEmbedUrl(selectedTrack.video_url) && (
                <div className="track-video">
                  <h4>Video</h4>
                  <div className="video-container">
                    <iframe
                      src={getYouTubeEmbedUrl(selectedTrack.video_url)}
                      title={`${selectedTrack.title} Video`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {selectedTrack.lyrics && (
                <div className="track-lyrics">
                  <h4>Lyrics</h4>
                  <pre className="lyrics-text">{selectedTrack.lyrics}</pre>
                </div>
              )}

              {!selectedTrack.video_url && !selectedTrack.lyrics && (
                <p className="no-content">No video or lyrics available for this track.</p>
              )}
            </div>
          )}
        </div>
      )}

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
