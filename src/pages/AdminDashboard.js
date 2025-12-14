import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '../utils/api';
import { useRouter } from 'next/router';

// Helper function to handle API responses with consistent error handling
const handleApiResponse = (response, successMessage, errorCallback) => {
  if (response.ok) {
    if (successMessage) alert(successMessage);
    return true;
  } else {
    alert(response.error || errorCallback || 'Operation failed');
    return false;
  }
};

function AdminDashboard({ albumRequests, appState, onNavigate }) {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState('overview'); // 'overview', 'requests', 'reviews', 'albums', 'tracks', 'users'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [selectedAlbumForTracks, setSelectedAlbumForTracks] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [editingTrack, setEditingTrack] = useState(null);
  const [newTrack, setNewTrack] = useState({ track_number: '', title: '', duration: '', lyrics: '', video_url: '' });
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
  const [editTrackData, setEditTrackData] = useState({
    track_number: '',
    title: '',
    duration: '',
    lyrics: '',
    video_url: ''
  });
  const hasFetchedInitialDataRef = useRef(false);

  useEffect(() => {
    // Only fetch on initial load
    if (!hasFetchedInitialDataRef.current) {
      hasFetchedInitialDataRef.current = true;
      appState.fetchAlbumRequests();
      appState.fetchAllReviews();
      appState.fetchAlbums(true);
    }
  }, []);

  useEffect(() => {
    // Fetch data when switching views
    if (view === 'users' && users.length === 0) {
      fetchUsers();
    } else if (view === 'albums') {
      appState.fetchAlbums(true);
    } else if (view === 'overview') {
      appState.fetchAlbums(true);
      appState.fetchAlbumRequests();
    }
  }, [view]);

  useEffect(() => {
    setRequests(albumRequests || []);
  }, [albumRequests]);

  const fetchUsers = async () => {
    try {
      const response = await fetchAPI('/api/users');
      if (response.ok && response.data) {
        setUsers(response.data);
      } else {
        console.error('Failed to fetch users:', response.error);
        // Set empty array on error to avoid showing stale data
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchUserReviews = async (userId) => {
    try {
      const response = await fetchAPI(`/api/reviews/user/${userId}`);
      if (response.ok && response.data) {
        setUserReviews(response.data);
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      const response = await fetchAPI(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
      if (handleApiResponse(response, 'User role updated successfully!', 'Error updating user role')) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role');
    }
  };

  const handleViewUserReviews = (user) => {
    setSelectedUser(user);
    fetchUserReviews(user.user_id);
  };

  const handleApprove = async (requestId) => {
    if (!confirm('Are you sure you want to approve this album request?')) return;
    
    try {
      const response = await fetchAPI(`/api/album-requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' })
      });
      if (handleApiResponse(response, 'Album request approved successfully!', 'Error approving request')) {
        appState.fetchAlbumRequests();
        appState.fetchAlbums(true);
        appState.fetchTopAlbums(true);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const handleDeny = async (requestId) => {
    if (!confirm('Are you sure you want to deny this album request?')) return;
    
    try {
      const response = await fetchAPI(`/api/album-requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'denied' })
      });
      if (handleApiResponse(response, 'Album request denied', 'Error denying request')) {
        appState.fetchAlbumRequests();
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
      if (handleApiResponse(response, 'Album request updated successfully!', 'Error updating request')) {
        setEditingRequest(null);
        appState.fetchAlbumRequests();
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
      if (handleApiResponse(response, 'Album updated successfully!', 'Error updating album')) {
        setEditingAlbum(null);
        appState.fetchAlbums(true);
        appState.fetchTopAlbums(true);
      }
    } catch (error) {
      console.error('Error updating album:', error);
      alert('Error updating album');
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (!confirm('Are you sure you want to delete this album? This action cannot be undone.')) return;
    
    try {
      const response = await fetchAPI(`/api/albums/${albumId}`, { method: 'DELETE' });
      if (handleApiResponse(response, 'Album deleted successfully!', 'Error deleting album')) {
        appState.fetchAlbums(true);
        appState.fetchTopAlbums(true);
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
      appState.fetchTopAlbums(true);
      appState.fetchAlbums(true);
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
      appState.fetchTopAlbums(true);
      appState.fetchAlbums(true);
    } catch (error) {
      console.error('Error flagging review:', error);
      alert('Error flagging review');
    }
  };

  // Track Management Functions
  const fetchTracks = async (albumId) => {
    try {
      const response = await fetchAPI(`/api/tracks?albumId=${albumId}`);
      if (response.ok) {
        console.log('Fetched tracks:', response.data);
        console.log('First track keys:', response.data[0] ? Object.keys(response.data[0]) : 'No tracks');
        setTracks(response.data || []);
      } else {
        console.error('Error fetching tracks:', response.error);
        setTracks([]);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      setTracks([]);
    }
  };

  const handleAddTrack = async () => {
    if (!selectedAlbumForTracks) {
      alert('Please select an album first');
      return;
    }

    if (!newTrack.track_number || !newTrack.title) {
      alert('Track number and title are required');
      return;
    }

    try {
      const response = await fetchAPI('/api/tracks', {
        method: 'POST',
        body: JSON.stringify({
          album_id: selectedAlbumForTracks,
          track_number: parseInt(newTrack.track_number),
          title: newTrack.title,
          duration: newTrack.duration || null,
          lyrics: newTrack.lyrics || null,
          video_url: newTrack.video_url || null
        })
      });

      if (response.ok) {
        alert('Track added successfully!');
        setNewTrack({ track_number: '', title: '', duration: '', lyrics: '', video_url: '' });
        fetchTracks(selectedAlbumForTracks);
      } else {
        alert(response.error || 'Error adding track');
      }
    } catch (error) {
      console.error('Error adding track:', error);
      alert('Error adding track');
    }
  };

  const handleEditTrack = (track) => {
    console.log('Editing track:', track);
    console.log('Track ID:', track.track_id);
    setEditingTrack(track.track_id);
    setEditTrackData({
      track_number: track.track_number,
      title: track.title,
      duration: track.duration || '',
      lyrics: track.lyrics || '',
      video_url: track.video_url || ''
    });
  };

  const handleSaveTrack = async (trackId) => {
    console.log('Saving track with ID:', trackId);
    console.log('editingTrack state:', editingTrack);
    console.log('Track data:', editTrackData);
    
    if (!trackId) {
      alert('Error: Track ID is missing');
      console.error('Track ID is undefined or null');
      return;
    }
    
    if (!editTrackData.track_number || !editTrackData.title) {
      alert('Track number and title are required');
      return;
    }

    try {
      const response = await fetchAPI(`/api/tracks/${trackId}`, {
        method: 'PUT',
        body: JSON.stringify({
          track_number: parseInt(editTrackData.track_number),
          title: editTrackData.title,
          duration: editTrackData.duration || null,
          lyrics: editTrackData.lyrics || null,
          video_url: editTrackData.video_url || null
        })
      });

      if (response.ok) {
        alert('Track updated successfully!');
        setEditingTrack(null);
        setEditTrackData({ track_number: '', title: '', duration: '', lyrics: '', video_url: '' });
        fetchTracks(selectedAlbumForTracks);
      } else {
        alert(response.error || 'Error updating track');
      }
    } catch (error) {
      console.error('Error updating track:', error);
      alert('Error updating track');
    }
  };

  const handleDeleteTrack = async (trackId) => {
    if (!confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetchAPI(`/api/tracks/${trackId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Track deleted successfully!');
        fetchTracks(selectedAlbumForTracks);
      } else {
        alert(response.error || 'Error deleting track');
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      alert('Error deleting track');
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
          <div className="dashboard-card" onClick={() => setView('tracks')}>
            <h3>Manage Tracks</h3>
            <p><span className="dashboard-number">♫</span> Edit album tracks</p>
          </div>
          <div className="dashboard-card" onClick={() => setView('users')}>
            <h3>Manage Users</h3>
            <p><span className="dashboard-number">{users.length || 0}</span> registered user{(users.length || 0) !== 1 ? 's' : ''}</p>
          </div>
          <div className="dashboard-card" onClick={() => router.push('/edit-album')}>
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
                        <p><strong>Rating:</strong> {album.avg_rating ? album.avg_rating.toFixed(1) : 'N/A'}</p>
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

  if (view === 'tracks') {
    return (
      <div className="page-container admin-dashboard">
        <button onClick={() => setView('overview')} className="back-btn">← Back to Dashboard</button>
        <h1>Manage Tracks</h1>

        <div className="admin-section">
          <h2>Select Album</h2>
          <select 
            value={selectedAlbumForTracks || ''} 
            onChange={(e) => {
              const albumId = e.target.value;
              setSelectedAlbumForTracks(albumId);
              if (albumId) {
                fetchTracks(albumId);
              } else {
                setTracks([]);
              }
            }}
            className="form-input"
          >
            <option value="">-- Select an album --</option>
            {appState.albums && appState.albums.map(album => (
              <option key={album.album_id} value={album.album_id}>
                {album.title} - {album.artist_name}
              </option>
            ))}
          </select>

          {selectedAlbumForTracks && (
            <>
              <h2>Add New Track</h2>
              <div className="add-track-form">
                <input
                  type="number"
                  value={newTrack.track_number}
                  onChange={(e) => setNewTrack({...newTrack, track_number: e.target.value})}
                  placeholder="Track Number"
                  className="form-input"
                  min="1"
                />
                <input
                  type="text"
                  value={newTrack.title}
                  onChange={(e) => setNewTrack({...newTrack, title: e.target.value})}
                  placeholder="Track Title"
                  className="form-input"
                />
                <input
                  type="text"
                  value={newTrack.duration}
                  onChange={(e) => setNewTrack({...newTrack, duration: e.target.value})}
                  placeholder="Duration (e.g., 3:45)"
                  className="form-input"
                />
                <input
                  type="text"
                  value={newTrack.video_url}
                  onChange={(e) => setNewTrack({...newTrack, video_url: e.target.value})}
                  placeholder="Video URL (YouTube link, optional)"
                  className="form-input"
                />
                <textarea
                  value={newTrack.lyrics}
                  onChange={(e) => setNewTrack({...newTrack, lyrics: e.target.value})}
                  placeholder="Lyrics (optional)"
                  className="form-input"
                  rows="8"
                />
                <button onClick={handleAddTrack} className="approve-button">
                  Add Track
                </button>
              </div>

              <h2>Track List ({tracks.length})</h2>
              <div className="tracks-list">
                {tracks && tracks.length > 0 ? (
                  tracks.sort((a, b) => a.track_number - b.track_number).map(track => (
                    <div key={track.track_id} className="request-card">
                      {editingTrack === track.track_id ? (
                        <div className="edit-track-form">
                          <input
                            type="number"
                            value={editTrackData.track_number}
                            onChange={(e) => setEditTrackData({...editTrackData, track_number: e.target.value})}
                            placeholder="Track Number"
                            className="form-input"
                            min="1"
                          />
                          <input
                            type="text"
                            value={editTrackData.title}
                            onChange={(e) => setEditTrackData({...editTrackData, title: e.target.value})}
                            placeholder="Track Title"
                            className="form-input"
                          />
                          <input
                            type="text"
                            value={editTrackData.duration}
                            onChange={(e) => setEditTrackData({...editTrackData, duration: e.target.value})}
                            placeholder="Duration (e.g., 3:45)"
                            className="form-input"
                          />
                          <input
                            type="text"
                            value={editTrackData.video_url}
                            onChange={(e) => setEditTrackData({...editTrackData, video_url: e.target.value})}
                            placeholder="Video URL (YouTube link, optional)"
                            className="form-input"
                          />
                          <textarea
                            value={editTrackData.lyrics}
                            onChange={(e) => setEditTrackData({...editTrackData, lyrics: e.target.value})}
                            placeholder="Lyrics (optional)"
                            className="form-input"
                            rows="8"
                          />
                          <div className="request-actions">
                            <button onClick={() => handleSaveTrack(editingTrack)} className="approve-button">
                              Save
                            </button>
                            <button onClick={() => {
                              setEditingTrack(null);
                              setEditTrackData({ track_number: '', title: '', duration: '', lyrics: '', video_url: '' });
                            }} className="deny-button">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="review-left">
                            <h3>Track {track.track_number}</h3>
                            <p><strong>{track.title}</strong></p>
                            {track.duration && <p className="track-duration">{track.duration}</p>}
                          </div>
                          <div className="review-right">
                            <div className="review-actions">
                              <button onClick={() => handleEditTrack(track)} className="edit-button">
                                Edit
                              </button>
                              <button onClick={() => handleDeleteTrack(track.track_id)} className="deny-button">
                                Delete
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-results">No tracks found for this album.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (view === 'users') {
    // Filter and sort users
    const filteredUsers = users
      .filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at) - new Date(a.created_at);
        } else if (sortBy === 'oldest') {
          return new Date(a.created_at) - new Date(b.created_at);
        } else if (sortBy === 'username') {
          return a.username.localeCompare(b.username);
        }
        return 0;
      });

    return (
      <div className="page-container admin-dashboard">
        <div className="admin-section">
          <button onClick={() => setView('overview')} className="back-btn">← Back to Dashboard</button>
          <h2>Manage Users</h2>

          {selectedUser ? (
            <div>
              <button onClick={() => setSelectedUser(null)} className="back-btn">← Back to Users</button>
              <h3>Reviews by {selectedUser.username}</h3>
              {userReviews.length > 0 ? (
                <div className="reviews-list">
                  {userReviews.map(review => (
                    <div key={review.review_id} className="admin-review-card">
                      <h4>{review.album_title} by {review.artist_name}</h4>
                      <div className="review-rating">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={`star ${star <= review.rating ? 'filled' : ''}`}>★</span>
                        ))}
                      </div>
                      <p>{review.review_text}</p>
                      <p className="review-date">{new Date(review.created_at).toLocaleDateString()}</p>
                      {review.is_flagged && <span className="flagged-badge">Flagged</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No reviews by this user.</p>
              )}
            </div>
          ) : (
            <>
              <div className="reviews-controls">
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filter-controls">
                  <div className="filter-group">
                    <label>Sort by:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="username">Username (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="reviews-stats">
                <p>Showing {filteredUsers.length} of {users.length} users</p>
              </div>

              <div className="album-list-admin">
                {filteredUsers.map(user => (
                <div key={user.user_id} className="admin-album-item">
                  <div className="admin-album-info">
                    <h3>{user.username}</h3>
                    <p>Email: {user.email}</p>
                    <p>Role: <strong>{user.role}</strong></p>
                    <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="admin-album-actions">
                    <button 
                      onClick={() => handleViewUserReviews(user)} 
                      className="view-btn"
                    >
                      View Reviews
                    </button>
                    {user.role === 'customer' ? (
                      <button 
                        onClick={() => handleUpdateUserRole(user.user_id, 'admin')} 
                        className="approve-btn"
                      >
                        Make Admin
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateUserRole(user.user_id, 'customer')} 
                        className="deny-btn"
                      >
                        Remove Admin
                      </button>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}

export default AdminDashboard;
