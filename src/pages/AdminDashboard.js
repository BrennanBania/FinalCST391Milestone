import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';

function AdminDashboard({ albumRequests, appState, onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState('overview'); // 'overview', 'requests', 'reviews', 'albums'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [editingRequest, setEditingRequest] = useState(null);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    artist_name: '',
    genre: '',
    release_year: '',
    image_url: '',
    video_url: ''
  });
  const [editAlbumData, setEditAlbumData] = useState({
    title: '',
    artist_name: '',
    genre: '',
    release_year: '',
    description: '',
    image_url: '',
    video_url: ''
  });

  useEffect(() => {
    appState.fetchAlbumRequests();
    appState.fetchAllReviews();
  }, []);

  useEffect(() => {
    setRequests(albumRequests || []);
  }, [albumRequests]);

  const handleApprove = async (requestId) => {
    if (!confirm('Are you sure you want to approve this album request?')) {
      return;
    }
    
    try {
      const response = await fetchAPI(`/api/album-requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' })
      });
      
      if (response.ok) {
        alert('Album request approved successfully!');
        appState.fetchAlbumRequests();
        appState.fetchAlbums();
      } else {
        alert(response.error || 'Error approving request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const handleDeny = async (requestId) => {
    if (!confirm('Are you sure you want to deny this album request?')) {
      return;
    }
    
    try {
      const response = await fetchAPI(`/api/album-requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'denied' })
      });
      
      if (response.ok) {
        alert('Album request denied');
        appState.fetchAlbumRequests();
      } else {
        alert(response.error || 'Error denying request');
      }
    } catch (error) {
      console.error('Error denying request:', error);
      alert('Error denying request');
    }
  };

  const handleEditRequest = (request) => {
    setEditingRequest(request.request_id);
    setEditFormData({
      title: request.title,
      artist_name: request.artist_name,
      genre: request.genre || '',
      release_year: request.release_year || '',
      image_url: request.image_url || '',
      video_url: request.video_url || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingRequest(null);
    setEditFormData({
      title: '',
      artist_name: '',
      genre: '',
      release_year: '',
      image_url: '',
      video_url: ''
    });
  };

  const handleSaveEdit = async (requestId) => {
    try {
      const response = await fetchAPI(`/api/album-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify(editFormData)
      });
      
      if (response.ok) {
        alert('Album request updated successfully!');
        setEditingRequest(null);
        appState.fetchAlbumRequests();
      } else {
        alert(response.error || 'Error updating request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Error updating request');
    }
  };

  const handleEditAlbum = (album) => {
    setEditingAlbum(album.album_id);
    setEditAlbumData({
      title: album.title,
      artist_name: album.artist_name,
      genre: album.genre || '',
      release_year: album.release_year || '',
      description: album.description || '',
      image_url: album.image_url || '',
      video_url: album.video_url || ''
    });
  };

  const handleCancelEditAlbum = () => {
    setEditingAlbum(null);
    setEditAlbumData({
      title: '',
      artist_name: '',
      genre: '',
      release_year: '',
      description: '',
      image_url: '',
      video_url: ''
    });
  };

  const handleSaveAlbum = async (albumId) => {
    try {
      const response = await fetchAPI(`/api/albums/${albumId}`, {
        method: 'PUT',
        body: JSON.stringify(editAlbumData)
      });
      
      if (response.ok) {
        alert('Album updated successfully!');
        setEditingAlbum(null);
        appState.fetchAlbums();
      } else {
        alert(response.error || 'Error updating album');
      }
    } catch (error) {
      console.error('Error updating album:', error);
      alert('Error updating album');
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (!confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetchAPI(`/api/albums/${albumId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('Album deleted successfully!');
        appState.fetchAlbums();
      } else {
        alert(response.error || 'Error deleting album');
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Error deleting album');
    }
  };

  const handleUnflagReview = async (reviewId) => {
    try {
      await fetchAPI(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ flagged: false })
      });
      appState.fetchAllReviews();
    } catch (error) {
      console.error('Error unflagging review:', error);
      alert('Error unflagging review');
    }
  };

  const handleFlagReview = async (reviewId) => {
    try {
      await fetchAPI(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ flagged: true })
      });
      appState.fetchAllReviews();
    } catch (error) {
      console.error('Error flagging review:', error);
      alert('Error flagging review');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');
  const flaggedReviews = (appState.allReviews || []).filter(r => r.is_flagged);

  if (view === 'overview') {
    return (
      <div className="page-container admin-dashboard">
        <h1>Admin Dashboard</h1>
        <div className="dashboard-grid">
          <div className="dashboard-card" onClick={() => setView('requests')}>
            <h3>Album Requests</h3>
            <p><span className="dashboard-number">{pendingRequests.length}</span> pending request{pendingRequests.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="dashboard-card" onClick={() => setView('reviews')}>
            <h3>Manage Reviews</h3>
            <p><span className="dashboard-number">{flaggedReviews.length}</span> flagged review{flaggedReviews.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="dashboard-card" onClick={() => setView('albums')}>
            <h3>Manage Albums</h3>
            <p><span className="dashboard-number">{appState.albums?.length || 0}</span> album{(appState.albums?.length || 0) !== 1 ? 's' : ''} in collection</p>
          </div>
          <div className="dashboard-card" onClick={() => onNavigate('edit-album')}>
            <h3>Add Album</h3>
            <p><span className="dashboard-number">+</span> Add new album to collection</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'requests') {
    return (
      <div className="page-container admin-dashboard">
        <button onClick={() => setView('overview')} className="back-btn">← Back to Dashboard</button>
        <h1>Album Requests</h1>

        <div className="admin-section">
          <h2>Pending Requests ({pendingRequests.length})</h2>
          <div className="requests-list">
            {pendingRequests && pendingRequests.length > 0 ? (
              pendingRequests.map(request => (
                <div key={request.request_id} className="request-card">
                  {editingRequest === request.request_id ? (
                    <div className="edit-request-form">
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                        placeholder="Album Title"
                        className="form-input"
                      />
                      <input
                        type="text"
                        value={editFormData.artist_name}
                        onChange={(e) => setEditFormData({...editFormData, artist_name: e.target.value})}
                        placeholder="Artist Name"
                        className="form-input"
                      />
                      <input
                        type="text"
                        value={editFormData.genre}
                        onChange={(e) => setEditFormData({...editFormData, genre: e.target.value})}
                        placeholder="Genre"
                        className="form-input"
                      />
                      <input
                        type="number"
                        value={editFormData.release_year}
                        onChange={(e) => setEditFormData({...editFormData, release_year: e.target.value})}
                        placeholder="Release Year"
                        className="form-input"
                      />
                      <input
                        type="text"
                        value={editFormData.image_url}
                        onChange={(e) => setEditFormData({...editFormData, image_url: e.target.value})}
                        placeholder="Image URL"
                        className="form-input"
                      />
                      <input
                        type="text"
                        value={editFormData.video_url}
                        onChange={(e) => setEditFormData({...editFormData, video_url: e.target.value})}
                        placeholder="Video URL"
                        className="form-input"
                      />
                      <div className="request-actions">
                        <button onClick={() => handleSaveEdit(request.request_id)} className="approve-button">
                          Save
                        </button>
                        <button onClick={handleCancelEdit} className="deny-button">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>{request.title}</h3>
                      <p><strong>Artist:</strong> {request.artist_name}</p>
                      <p><strong>Genre:</strong> {request.genre}</p>
                      <p><strong>Year:</strong> {request.release_year}</p>
                      <p><strong>Requested by:</strong> {request.username}</p>
                      {request.image_url && (
                        <img src={request.image_url} alt={request.title} className="request-image" />
                      )}
                      {request.video_url && (
                        <p><strong>Video:</strong> <a href={request.video_url} target="_blank" rel="noopener noreferrer">Watch</a></p>
                      )}
                      <div className="request-actions">
                        <button onClick={() => handleEditRequest(request)} className="edit-button">
                          Edit
                        </button>
                        <button onClick={() => handleApprove(request.request_id)} className="approve-button">
                          Approve
                        </button>
                        <button onClick={() => handleDeny(request.request_id)} className="deny-button">
                          Deny
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p>No pending requests</p>
            )}
          </div>
        </div>

        <div className="admin-section">
          <h2>Processed Requests ({processedRequests.length})</h2>
          <div className="requests-list">
            {processedRequests && processedRequests.length > 0 ? (
              processedRequests.map(request => (
                <div key={request.id} className={`request-card ${request.status}`}>
                  <h3>{request.title}</h3>
                  <p><strong>Status:</strong> {request.status.toUpperCase()}</p>
                  <p><strong>Requested by:</strong> {request.username}</p>
                </div>
              ))
            ) : (
              <p>No processed requests</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'reviews') {
    const allReviewsData = appState.allReviews || [];
    const flaggedReviewsList = allReviewsData.filter(r => r.is_flagged);
    const regularReviewsList = allReviewsData.filter(r => !r.is_flagged);

    const filterReviews = (reviews) => {
      let filtered = reviews;

      // Apply search
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
        filtered = [...filtered].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      }

      return filtered;
    };

    const filteredFlagged = filterReviews(flaggedReviewsList);
    const filteredRegular = filterReviews(regularReviewsList);

    return (
      <div className="page-container admin-dashboard">
        <button onClick={() => setView('overview')} className="back-btn">← Back to Dashboard</button>
        <h1>Manage Reviews</h1>

        <div className="reviews-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
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

        {/* Flagged Reviews Section */}
        <div className="admin-section">
          <h2>Flagged Reviews ({filteredFlagged.length})</h2>
          <div className="reviews-list">
            {filteredFlagged && filteredFlagged.length > 0 ? (
              filteredFlagged.map(review => (
                <div key={review.review_id} className="review-card-large flagged">
                  <div className="review-left">
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <h3>{review.album_title}</h3>
                    <p className="artist-name">{review.artist_name}</p>
                    <p className="review-author">By: {review.username}</p>
                    <p className="flagged-badge">⚠️ FLAGGED</p>
                  </div>
                  <div className="review-right">
                    <p className="review-text">{review.review_text}</p>
                    <div className="review-actions">
                      <button onClick={() => handleUnflagReview(review.review_id)} className="unflag-btn">
                        Unflag
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results">No flagged reviews</p>
            )}
          </div>
        </div>

        {/* All Reviews Section */}
        <div className="admin-section">
          <h2>All Reviews ({filteredRegular.length})</h2>
          <div className="reviews-list">
            {filteredRegular && filteredRegular.length > 0 ? (
              filteredRegular.map(review => (
                <div key={review.review_id} className="review-card-large">
                  <div className="review-left">
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <h3>{review.album_title}</h3>
                    <p className="artist-name">{review.artist_name}</p>
                    <p className="review-author">By: {review.username}</p>
                  </div>
                  <div className="review-right">
                    <p className="review-text">{review.review_text}</p>
                    <div className="review-actions">
                      <button onClick={() => handleFlagReview(review.review_id)} className="flag-btn">
                        Flag
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results">No reviews found matching your filters.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'albums') {
    const filterAlbums = () => {
      let filtered = appState.albums || [];

      // Apply search
      if (searchTerm) {
        filtered = filtered.filter(a =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.genre && a.genre.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Apply sorting
      if (sortBy === 'rating-high') {
        filtered = [...filtered].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
      } else if (sortBy === 'rating-low') {
        filtered = [...filtered].sort((a, b) => (a.avg_rating || 0) - (b.avg_rating || 0));
      } else {
        filtered = [...filtered].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      }

      return filtered;
    };

    const filteredAlbums = filterAlbums();

    return (
      <div className="page-container admin-dashboard">
        <button onClick={() => setView('overview')} className="back-btn">← Back to Dashboard</button>
        <h1>Manage Albums</h1>

        <div className="reviews-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search albums..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
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

        <div className="admin-section">
          <h2>All Albums ({filteredAlbums.length})</h2>
          <div className="reviews-list">
            {filteredAlbums && filteredAlbums.length > 0 ? (
              filteredAlbums.map(album => (
                <div key={album.album_id} className="review-card-large">
                  {editingAlbum === album.album_id ? (
                    <div className="edit-album-form">
                      <input
                        type="text"
                        value={editAlbumData.title}
                        onChange={(e) => setEditAlbumData({...editAlbumData, title: e.target.value})}
                        placeholder="Album Title"
                        className="form-input"
                      />
                      <input
                        type="text"
                        value={editAlbumData.artist_name}
                        onChange={(e) => setEditAlbumData({...editAlbumData, artist_name: e.target.value})}
                        placeholder="Artist Name"
                        className="form-input"
                      />
                      <input
                        type="text"
                        value={editAlbumData.genre}
                        onChange={(e) => setEditAlbumData({...editAlbumData, genre: e.target.value})}
                        placeholder="Genre"
                        className="form-input"
                      />
                      <input
                        type="number"
                        value={editAlbumData.release_year}
                        onChange={(e) => setEditAlbumData({...editAlbumData, release_year: e.target.value})}
                        placeholder="Release Year"
                        className="form-input"
                      />
                      <textarea
                        value={editAlbumData.description}
                        onChange={(e) => setEditAlbumData({...editAlbumData, description: e.target.value})}
                        placeholder="Description"
                        className="form-input"
                        rows="3"
                      />
                      <input
                        type="text"
                        value={editAlbumData.image_url}
                        onChange={(e) => setEditAlbumData({...editAlbumData, image_url: e.target.value})}
                        placeholder="Image URL"
                        className="form-input"
                      />
                      <input
                        type="text"
                        value={editAlbumData.video_url}
                        onChange={(e) => setEditAlbumData({...editAlbumData, video_url: e.target.value})}
                        placeholder="Video URL"
                        className="form-input"
                      />
                      <div className="request-actions">
                        <button onClick={() => handleSaveAlbum(album.album_id)} className="approve-button">
                          Save
                        </button>
                        <button onClick={handleCancelEditAlbum} className="deny-button">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="review-left">
                        {album.image_url && (
                          <img src={album.image_url} alt={album.title} className="request-image" />
                        )}
                        <h3>{album.title}</h3>
                        <p className="artist-name">{album.artist_name}</p>
                        <p><strong>Genre:</strong> {album.genre}</p>
                        <p><strong>Year:</strong> {album.release_year}</p>
                        <p><strong>Rating:</strong> {album.avg_rating ? album.avg_rating.toFixed(1) : 'N/A'} ⭐</p>
                        <p><strong>Reviews:</strong> {album.review_count || 0}</p>
                      </div>
                      <div className="review-right">
                        {album.description && <p className="review-text">{album.description}</p>}
                        {album.video_url && (
                          <p><strong>Video:</strong> <a href={album.video_url} target="_blank" rel="noopener noreferrer">Watch</a></p>
                        )}
                        <div className="review-actions">
                          <button onClick={() => handleEditAlbum(album)} className="edit-button">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteAlbum(album.album_id)} className="deny-button">
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="no-results">No albums found matching your filters.</p>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default AdminDashboard;
