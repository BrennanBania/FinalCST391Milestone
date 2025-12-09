import React from 'react';

function ReviewCard({
  review,
  isEditing = false,
  editingData = {},
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onFlag,
  onUnflag,
  isMyReview = false,
  isFlagged = false,
  canUnflag = false,
}) {
  if (isEditing) {
    return (
      <div className="review-card-large edit-mode">
        <div className="edit-form">
          <h3>{review.album_title}</h3>
          <label>Rating:</label>
          <div className="rating-selector">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= editingData.rating ? 'filled' : ''}`}
                onClick={() => onEdit({ ...editingData, rating: star })}
                style={{ cursor: 'pointer' }}
              >
                ★
              </span>
            ))}
          </div>
          <label>Review:</label>
          <textarea
            value={editingData.reviewText}
            onChange={(e) => onEdit({ ...editingData, reviewText: e.target.value })}
            rows="4"
          />
          <div className="edit-buttons">
            <button onClick={() => onSave(review.review_id)} className="save-btn">
              Save
            </button>
            <button onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="reviewer-info">
          <strong>{review.username || 'Anonymous'}</strong>
          <span className="review-date">
            {new Date(review.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
        <div className="review-rating">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>
              ★
            </span>
          ))}
        </div>
      </div>
      {(review.album_title || review.artist_name) && (
        <div className="album-info">
          <strong>{review.album_title}</strong>
          {review.artist_name && <span> by {review.artist_name}</span>}
        </div>
      )}
      <div className="review-body">
        <p className="review-text">{review.review_text}</p>
      </div>
      <div className="review-footer">
        <div className="review-actions">
          {isMyReview && (
            <>
              <button
                onClick={() => onEdit()}
                className="edit-btn"
              >
                Edit
              </button>
              <button onClick={() => onDelete(review.review_id)} className="delete-btn">
                Delete
              </button>
            </>
          )}
          {!isMyReview && !isFlagged && (
            <button onClick={() => onFlag(review.review_id)} className="flag-btn">
              Flag
            </button>
          )}
          {isFlagged && canUnflag && (
            <button onClick={() => onUnflag(review.review_id)} className="unflag-btn">
              Unflag
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewCard;
