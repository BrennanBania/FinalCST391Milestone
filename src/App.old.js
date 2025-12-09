import React, { useState, useEffect } from 'react';
import './index.css';

// API base URL - empty string in production (same server), localhost:5000 in development
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'albums', 'myReviews', 'albumDetail', 'adminDashboard', 'allReviews', 'editAlbum', 'adminAlbums', 'requestAlbum'
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [editAlbum, setEditAlbum] = useState(null);
  const [albumRequests, setAlbumRequests] = useState([]);
  const [newAlbumRequest, setNewAlbumRequest] = useState({
    title: '',
    artist_id: '',
    release_year: '',
    genre: '',
    description: '',
    image_url: '',
    video_url: ''
  });
  const [newAlbum, setNewAlbum] = useState({
    title: '',
    artist_id: '',
    release_year: '',
    genre: '',
    description: '',
    image_url: '',
    video_url: ''
  });
  const [reviews, setReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [username, setUsername] = useState('');
  const [newReview, setNewReview] = useState({ rating: 5, reviewText: '' });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingReviewData, setEditingReviewData] = useState({ rating: 5, reviewText: '' });
  const [flaggedSectionCollapsed, setFlaggedSectionCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [topAlbums, setTopAlbums] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setUsername(decoded.username);
      setIsAdmin(decoded.role === 'admin');
      setIsLoggedIn(true);
      fetchAlbums();
      fetchArtists();
      fetchTopAlbums();
      setCurrentView('home'); // Ensure home is default after login
    } else {
      // Load data for viewers (not logged in)
      fetchAlbums();
      fetchArtists();
      fetchTopAlbums();
      setCurrentView('home');
    }
  }, []);

  const fetchAlbums = async () => {
    try {
      console.log('Fetching albums...');
      const response = await fetch(`${API_BASE_URL}/api/albums`);
      const data = await response.json();
      console.log('Albums response:', data);
      if (Array.isArray(data)) {
        setAlbums(data);
      } else if (data.albums && Array.isArray(data.albums)) {
        setAlbums(data.albums);
      } else {
        console.error('Invalid albums data:', data);
        setAlbums([]);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
      setAlbums([]);
    }
  };

  const fetchArtists = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/artists`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setArtists(data);
      } else if (data.artists && Array.isArray(data.artists)) {
        setArtists(data.artists);
      } else {
        console.error('Invalid artists data:', data);
        setArtists([]);
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
      setArtists([]);
    }
  };

  const fetchTopAlbums = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/albums/top`);
      const data = await response.json();
      setTopAlbums(data);
    } catch (error) {
      setTopAlbums([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? 
          { email: formData.email, password: formData.password } : 
          formData
        )
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          const decoded = JSON.parse(atob(data.token.split('.')[1]));
          setUsername(decoded.username);
          setIsAdmin(decoded.role === 'admin');
          setMessage('');
          setIsLoggedIn(true);
          await fetchAlbums();
        } else {
          setMessage('Registration successful! Please login.');
          setIsLogin(true);
          setFormData({ username: '', email: '', password: '' });
        }
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Server error. Make sure the backend is running.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setAlbums([]);
    setSelectedAlbum(null);
  };

  const handleViewAlbum = async (album) => {
    setSelectedAlbum(album);
    setCurrentView('albumDetail');
    await fetchReviews(album.album_id);
  };

  const fetchReviews = async (albumId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/albums/${albumId}/reviews`);
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  const fetchMyReviews = async () => {
    const token = localStorage.getItem('token');
    const userId = JSON.parse(atob(token.split('.')[1])).userId;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMyReviews(data || []);
    } catch (error) {
      console.error('Error fetching my reviews:', error);
      setMyReviews([]);
    }
  };

  const handleViewMyReviews = async () => {
    setCurrentView('myReviews');
    await fetchMyReviews();
  };

  const fetchAllReviews = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAllReviews(data || []);
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      setAllReviews([]);
    }
  };

  const handleViewAllReviews = async () => {
    setCurrentView('allReviews');
    await fetchAllReviews();
  };

  const handleEditAlbum = (album) => {
    setEditAlbum({ ...album });
    setCurrentView('editAlbum');
  };

  const handleViewRequest = (request) => {
    setEditAlbum({ ...request, album_id: request.request_id });
    setCurrentView('editAlbum');
  };

  const handleViewAdminAlbums = async () => {
    setCurrentView('adminAlbums');
    await fetchAlbums();
    await fetchAlbumRequests();
  };

  const handleUpdateAlbum = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/albums/${editAlbum.album_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editAlbum.title,
          releaseYear: editAlbum.release_year,
          imageUrl: editAlbum.image_url,
          videoUrl: editAlbum.video_url
        })
      });

      if (response.ok) {
        alert('Album updated successfully');
        await fetchAlbums();
        setCurrentView('adminAlbums');
      } else {
        alert('Failed to update album');
      }
    } catch (error) {
      console.error('Error updating album:', error);
      alert('Error updating album');
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/albums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newAlbum.title,
          artistId: newAlbum.artist_id,
          releaseYear: newAlbum.release_year,
          genre: newAlbum.genre,
          description: newAlbum.description,
          imageUrl: newAlbum.image_url,
          videoUrl: newAlbum.video_url
        })
      });

      if (response.ok) {
        alert('Album created successfully');
        await fetchAlbums();
        setNewAlbum({ title: '', artist_id: '', release_year: '', genre: '', description: '', image_url: '', video_url: '' });
        setCurrentView('adminAlbums');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create album');
      }
    } catch (error) {
      console.error('Error creating album:', error);
      alert('Error creating album');
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (!window.confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/albums/${albumId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Album deleted successfully');
        await fetchAlbums();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete album');
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Error deleting album');
    }
  };

  const fetchAlbumRequests = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/album-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlbumRequests(data);
      }
    } catch (error) {
      console.error('Error fetching album requests:', error);
    }
  };

  const handleRequestAlbum = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/album-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newAlbumRequest.title,
          artistId: newAlbumRequest.artist_id,
          releaseYear: newAlbumRequest.release_year,
          genre: newAlbumRequest.genre,
          description: newAlbumRequest.description,
          imageUrl: newAlbumRequest.image_url,
          videoUrl: newAlbumRequest.video_url
        })
      });

      if (response.ok) {
        alert('Album request submitted successfully! An admin will review it.');
        setNewAlbumRequest({ title: '', artist_id: '', release_year: '', genre: '', description: '', image_url: '', video_url: '' });
        setCurrentView('albums');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit album request');
      }
    } catch (error) {
      console.error('Error submitting album request:', error);
      alert('Error submitting album request');
    }
  };

  const handleApproveRequest = async (requestId) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/album-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved' })
      });

      if (response.ok) {
        alert('Album request approved and album created!');
        await fetchAlbumRequests();
        await fetchAlbums();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const handleDenyRequest = async (requestId) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/album-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'denied' })
      });

      if (response.ok) {
        alert('Album request denied');
        await fetchAlbumRequests();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to deny request');
      }
    } catch (error) {
      console.error('Error denying request:', error);
      alert('Error denying request');
    }
  };

  const handleEditReview = async (reviewId) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: editingReviewData.rating,
          reviewText: editingReviewData.reviewText
        })
      });

      if (response.ok) {
        setEditingReviewId(null);
        setEditingReviewData({ rating: 5, reviewText: '' });
        await fetchMyReviews();
      } else {
        alert('Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Error updating review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchMyReviews();
      } else {
        alert('Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error deleting review');
    }
  };

  const handleFlagReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to flag this review as inappropriate?')) {
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ flagged: true })
      });

      if (response.ok) {
        alert('Review flagged successfully');
        await fetchReviews(selectedAlbum.album_id);
      } else {
        alert('Failed to flag review');
      }
    } catch (error) {
      console.error('Error flagging review:', error);
      alert('Error flagging review');
    }
  };

  const handleUnflagReview = async (reviewId) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ flagged: false })
      });

      if (response.ok) {
        await fetchAllReviews();
      } else {
        alert('Failed to unflag review');
      }
    } catch (error) {
      console.error('Error unflagging review:', error);
      alert('Error unflagging review');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          albumId: selectedAlbum.album_id,
          rating: newReview.rating,
          reviewText: newReview.reviewText
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNewReview({ rating: 5, reviewText: '' });
        await fetchReviews(selectedAlbum.album_id);
        await fetchTopAlbums();
        setMessage('Review submitted successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to submit review');
      }
    } catch (error) {
      setMessage('Server error. Please try again.');
    }
  };

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
    setCurrentView('albums');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (currentView === 'home') {
    return (
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">🎵 Music Collection</div>
          <div className="nav-links">
            <button onClick={() => setCurrentView('home')} className={`nav-btn${currentView === 'home' ? ' active' : ''}`}>Home</button>
            <button onClick={() => setCurrentView('albums')} className={`nav-btn${currentView === 'albums' ? ' active' : ''}`}>Albums</button>
            {isLoggedIn && <button onClick={handleViewMyReviews} className="nav-btn">My Reviews</button>}
            {isLoggedIn && isAdmin && <button onClick={() => setCurrentView('adminDashboard')} className="nav-btn">Admin</button>}
            {isLoggedIn && <span className="username-display">{username}</span>}
            {isLoggedIn && <button onClick={handleLogout} className="logout-btn">Logout</button>}
            {!isLoggedIn && <button onClick={() => setCurrentView('login')} className="logout-btn">Login</button>}
          </div>
        </nav>
        <div className="welcome-container">
          <h1>{isLoggedIn ? `Welcome, ${username}!` : 'Welcome to Music Collection'}</h1>
          <h2>Top Rated Albums</h2>
          <div className="albums-grid">
            {topAlbums && topAlbums.length > 0 ? (
              topAlbums.map((album) => (
                <div key={album.album_id} className="album-card">
                  <img src={album.image_url} alt={album.title} onError={(e) => e.target.style.display = 'none'} />
                  <h3>{album.title}</h3>
                  <p>{album.artist_name}</p>
                  <p className="genre">{album.genre}</p>
                  <p className="year">{album.release_year}</p>
                  <p className="rating">Rating: {album.avg_rating ? parseFloat(album.avg_rating).toFixed(2) : 'N/A'}</p>
                  {isLoggedIn && <button onClick={() => handleViewAlbum(album)} className="view-btn">View</button>}
                </div>
              ))
            ) : (
              <p>No top albums found</p>
            )}
          </div>
        </div>
      </div>
    );
  }



  if (currentView === 'albums') {
    return (
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">🎵 Music Collection</div>
          <div className="nav-links">
            <button onClick={() => setCurrentView('home')} className="nav-btn">Home</button>
            <button onClick={() => setCurrentView('albums')} className="nav-btn active">Albums</button>
            {isLoggedIn && <button onClick={handleViewMyReviews} className="nav-btn">My Reviews</button>}
            {isLoggedIn && isAdmin && <button onClick={() => setCurrentView('adminDashboard')} className="nav-btn">Admin</button>}
            {isLoggedIn && <span className="username-display">{username}</span>}
            {isLoggedIn && <button onClick={handleLogout} className="logout-btn">Logout</button>}
            {!isLoggedIn && <button onClick={() => setCurrentView('login')} className="logout-btn">Login</button>}
          </div>
        </nav>

        <div className="albums-container">
          <div className="page-header">
            <h1>Albums</h1>
            {isLoggedIn && !isAdmin && (
              <button onClick={() => setCurrentView('requestAlbum')} className="add-album-btn">
                + Request Album
              </button>
            )}
            {!isLoggedIn && (
              <p style={{color: '#666', fontSize: '0.9rem'}}>Login to request new albums</p>
            )}
          </div>
          <div className="albums-grid">
            {albums && albums.length > 0 ? (
              albums.map((album) => (
                <div key={album.album_id} className="album-card">
                  <img src={album.image_url} alt={album.title} />
                  <h3>{album.title}</h3>
                  <p>{album.artist_name}</p>
                  <p className="genre">{album.genre}</p>
                  <p className="year">{album.release_year}</p>
                  {album.review_count > 0 && <p className="rating">Rating: {parseFloat(album.avg_rating).toFixed(2)}</p>}
                  {album.review_count === 0 && <p className="rating">No ratings yet</p>}
                  {isLoggedIn && <button onClick={() => handleViewAlbum(album)} className="view-btn">View</button>}
                </div>
              ))
            ) : (
              <p>No albums found</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Album detail view for both logged-in users and viewers
  if (currentView === 'albumDetail' && selectedAlbum) {
    return (
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">🎵 Music Collection</div>
          <div className="nav-links">
            <button onClick={handleBackToAlbums} className="nav-btn">← Back to Albums</button>
            {isLoggedIn && <span className="username-display">{username}</span>}
            {isLoggedIn && <button onClick={handleLogout} className="logout-btn">Logout</button>}
            {!isLoggedIn && <button onClick={() => setCurrentView('login')} className="logout-btn">Login</button>}
          </div>
        </nav>

          <div className="album-detail">
            <div className="album-detail-content">
              <img src={selectedAlbum.image_url} alt={selectedAlbum.title} />
              <div className="album-info">
                <h1>{selectedAlbum.title}</h1>
                <h2>{selectedAlbum.artist_name}</h2>
                <p className="description">{selectedAlbum.description}</p>
                <div className="album-meta">
                  <span className="genre">{selectedAlbum.genre}</span>
                  <span className="year">{selectedAlbum.release_year}</span>
                </div>
                {selectedAlbum.video_url && (
                  <div className="video-container">
                    <h3>Music Video</h3>
                    <iframe
                      width="100%"
                      height="315"
                      src={selectedAlbum.video_url}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    ></iframe>
                    <a 
                      href={selectedAlbum.video_url.replace('/embed/', '/watch?v=')} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="youtube-link"
                      style={{display: 'none'}}
                    >
                      Watch on YouTube →
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="reviews-section">
              <h2>Reviews</h2>
              
              <form onSubmit={handleSubmitReview} className="review-form">
                <h3>Write a Review</h3>
                <div className="rating-input">
                  <label>Rating: </label>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${newReview.rating >= star ? 'filled' : ''}`}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <textarea
                  placeholder="Write your review here..."
                  value={newReview.reviewText}
                  onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })}
                  rows="4"
                />
                <button type="submit" className="submit-review-btn">Submit Review</button>
                {message && <div className="message">{message}</div>}
              </form>

              <div className="reviews-list">
                <h3>All Reviews ({reviews.length})</h3>
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.review_id} className="review-card">
                      <div className="review-header">
                        <strong>{review.username}</strong>
                        <div className="review-rating">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="review-text">{review.review_text}</p>
                      <div className="review-footer">
                        <p className="review-date">{new Date(review.created_at).toLocaleDateString()}</p>
                        {isAdmin && review.is_flagged && <span className="flagged-badge">Flagged</span>}
                        <button onClick={() => handleFlagReview(review.review_id)} className="flag-btn">🚩 Flag</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No reviews yet. Be the first to review!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
  }

  if (isLoggedIn) {
    if (currentView === 'myReviews') {
      return (
        <div className="App">
          <nav className="navbar">
            <div className="nav-brand">🎵 Music Collection</div>
            <div className="nav-links">
              <button onClick={() => setCurrentView('albums')} className="nav-btn">Albums</button>
              <button onClick={handleViewMyReviews} className="nav-btn active">My Reviews</button>
              {isAdmin && <button onClick={() => setCurrentView('adminDashboard')} className="nav-btn">Admin</button>}
              <span className="username-display">{username}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </nav>

          <div className="my-reviews-container">
            <h1>My Reviews</h1>
            {myReviews.length > 0 ? (
              <div className="reviews-list">
                {myReviews.map((review) => (
                  <div key={review.review_id}>
                    {editingReviewId === review.review_id ? (
                      <div className="review-card-large edit-mode">
                        <div className="edit-form">
                          <h3>{review.album_title}</h3>
                          <label>Rating:</label>
                          <div className="rating-selector">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`star ${star <= editingReviewData.rating ? 'filled' : ''}`}
                                onClick={() => setEditingReviewData({...editingReviewData, rating: star})}
                                style={{cursor: 'pointer'}}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <label>Review:</label>
                          <textarea
                            value={editingReviewData.reviewText}
                            onChange={(e) => setEditingReviewData({...editingReviewData, reviewText: e.target.value})}
                            rows="4"
                          />
                          <div className="edit-buttons">
                            <button onClick={() => handleEditReview(review.review_id)} className="save-btn">Save</button>
                            <button onClick={() => setEditingReviewId(null)} className="cancel-btn">Cancel</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="review-card-large">
                        <div className="review-left">
                          <div className="review-rating">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>★</span>
                            ))}
                          </div>
                          <h3>{review.album_title}</h3>
                          <p className="artist-name">{review.artist_name}</p>
                          <p className="review-date">{new Date(review.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</p>
                        </div>
                        <div className="review-right">
                          <p className="review-text">{review.review_text}</p>
                          <div className="review-actions">
                            <button onClick={() => {
                              setEditingReviewId(review.review_id);
                              setEditingReviewData({rating: review.rating, reviewText: review.review_text});
                            }} className="edit-btn">Edit</button>
                            <button onClick={() => handleDeleteReview(review.review_id)} className="delete-btn">Delete</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>You haven't written any reviews yet.</p>
                <button onClick={() => setCurrentView('albums')} className="view-btn">Browse Albums</button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (currentView === 'allReviews' && isAdmin) {
      return (
        <div className="App">
          <nav className="navbar">
            <div className="nav-brand">🎵 Music Collection</div>
            <div className="nav-links">
              <button onClick={() => setCurrentView('albums')} className="nav-btn">Albums</button>
              <button onClick={handleViewMyReviews} className="nav-btn">My Reviews</button>
              <button onClick={() => setCurrentView('adminDashboard')} className="nav-btn">Admin</button>
              <span className="username-display">{username}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </nav>

          <div className="all-reviews-container">
            <div className="page-header">
              <button onClick={() => setCurrentView('adminDashboard')} className="back-btn">← Back to Dashboard</button>
            </div>
            <h1>All Reviews</h1>
            
            {allReviews.filter(r => r.is_flagged).length > 0 && (
              <div className="flagged-reviews-section">
                <div className="flagged-header" onClick={() => setFlaggedSectionCollapsed(!flaggedSectionCollapsed)}>
                  <h2>🚩 Flagged Reviews ({allReviews.filter(r => r.is_flagged).length})</h2>
                  <button className="collapse-btn">{flaggedSectionCollapsed ? '▼' : '▲'}</button>
                </div>
                {!flaggedSectionCollapsed && (
                  <div className="reviews-list">
                    {allReviews.filter(r => r.is_flagged).map((review) => (
                      <div key={review.review_id} className="review-card-large admin-review-card flagged-review-card">
                        <div className="review-left">
                          <div className="review-rating">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>★</span>
                            ))}
                          </div>
                          <h3>{review.album_title}</h3>
                          <p className="artist-name">{review.artist_name}</p>
                          <p className="reviewer-name">By: {review.username}</p>
                          <p className="review-date">{new Date(review.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</p>
                        </div>
                        <div className="review-right">
                          <p className="review-text">{review.review_text}</p>
                        </div>
                        <div className="review-admin-actions">
                          <button onClick={() => handleUnflagReview(review.review_id)} className="unflag-btn">Unflag</button>
                          <button onClick={() => handleDeleteReview(review.review_id)} className="delete-btn">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {allReviews.filter(r => !r.is_flagged).length > 0 && (
              <div className="reviews-list">
                {allReviews.filter(r => !r.is_flagged).map((review) => (
                  <div key={review.review_id} className="review-card-large admin-review-card">
                    <div className="review-left">
                      <div className="review-rating">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>★</span>
                        ))}
                      </div>
                      <h3>{review.album_title}</h3>
                      <p className="artist-name">{review.artist_name}</p>
                      <p className="reviewer-name">By: {review.username}</p>
                      <p className="review-date">{new Date(review.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                    <div className="review-right">
                      <p className="review-text">{review.review_text}</p>
                    </div>
                    <div className="review-admin-actions">
                      <button onClick={() => handleDeleteReview(review.review_id)} className="delete-btn">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {allReviews.length === 0 && (
              <div className="empty-state">
                <p>No reviews found.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (currentView === 'addAlbum' && isAdmin) {
      return (
        <div className="App">
          <nav className="navbar">
            <div className="nav-brand">🎵 Music Collection</div>
            <div className="nav-links">
              <button onClick={() => setCurrentView('albums')} className="nav-btn">Albums</button>
              <button onClick={handleViewMyReviews} className="nav-btn">My Reviews</button>
              <button onClick={() => setCurrentView('adminDashboard')} className="nav-btn">Admin</button>
              <span className="username-display">{username}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </nav>

          <div className="edit-album-container">
            <div className="page-header">
              <button onClick={() => setCurrentView('adminAlbums')} className="back-btn">← Back to Albums</button>
            </div>
            <h1>Add New Album</h1>
            <form onSubmit={handleCreateAlbum} className="edit-album-form">
              <div className="form-group">
                <label>Album Title</label>
                <input
                  type="text"
                  value={newAlbum.title}
                  onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Artist</label>
                <select
                  value={newAlbum.artist_id}
                  onChange={(e) => setNewAlbum({ ...newAlbum, artist_id: e.target.value })}
                  required
                >
                  <option value="">Select an artist</option>
                  {Array.isArray(artists) && artists.map((artist) => (
                    <option key={artist.artist_id} value={artist.artist_id}>
                      {artist.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Release Year</label>
                <input
                  type="number"
                  value={newAlbum.release_year}
                  onChange={(e) => setNewAlbum({ ...newAlbum, release_year: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Genre</label>
                <input
                  type="text"
                  value={newAlbum.genre}
                  onChange={(e) => setNewAlbum({ ...newAlbum, genre: e.target.value })}
                  placeholder="e.g., Pop, Rock, Jazz"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newAlbum.description}
                  onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                  placeholder="Brief description of the album..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={newAlbum.image_url}
                  onChange={(e) => setNewAlbum({ ...newAlbum, image_url: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Video URL (YouTube)</label>
                <input
                  type="url"
                  value={newAlbum.video_url}
                  onChange={(e) => setNewAlbum({ ...newAlbum, video_url: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">Create Album</button>
                <button type="button" onClick={() => setCurrentView('adminAlbums')} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    if (currentView === 'requestAlbum' && !isAdmin) {
      return (
        <div className="App">
          <nav className="navbar">
            <div className="nav-brand">🎵 Music Collection</div>
            <div className="nav-links">
              <button onClick={() => setCurrentView('albums')} className="nav-btn">Albums</button>
              <button onClick={handleViewMyReviews} className="nav-btn">My Reviews</button>
              <span className="username-display">{username}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </nav>

          <div className="add-album-container">
            <div className="page-header">
              <button onClick={() => setCurrentView('albums')} className="back-btn">← Back to Albums</button>
              <h1>Request New Album</h1>
            </div>
            <form onSubmit={handleRequestAlbum} className="add-album-form">
              <div className="form-group">
                <label>Album Title</label>
                <input
                  type="text"
                  value={newAlbumRequest.title}
                  onChange={(e) => setNewAlbumRequest({ ...newAlbumRequest, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Artist</label>
                <select
                  value={newAlbumRequest.artist_id}
                  onChange={(e) => setNewAlbumRequest({ ...newAlbumRequest, artist_id: e.target.value })}
                  required
                >
                  <option value="">Select an artist</option>
                  {artists.map((artist) => (
                    <option key={artist.artist_id} value={artist.artist_id}>
                      {artist.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Release Year</label>
                <input
                  type="number"
                  value={newAlbumRequest.release_year}
                  onChange={(e) => setNewAlbumRequest({ ...newAlbumRequest, release_year: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Genre</label>
                <input
                  type="text"
                  value={newAlbumRequest.genre}
                  onChange={(e) => setNewAlbumRequest({ ...newAlbumRequest, genre: e.target.value })}
                  placeholder="e.g., Pop, Rock, Jazz"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newAlbumRequest.description}
                  onChange={(e) => setNewAlbumRequest({ ...newAlbumRequest, description: e.target.value })}
                  rows="4"
                  placeholder="Brief description of the album"
                  required
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={newAlbumRequest.image_url}
                  onChange={(e) => setNewAlbumRequest({ ...newAlbumRequest, image_url: e.target.value })}
                  placeholder="https://example.com/album-cover.jpg"
                  required
                />
              </div>

              <div className="form-group">
                <label>Video URL (YouTube)</label>
                <input
                  type="url"
                  value={newAlbumRequest.video_url}
                  onChange={(e) => setNewAlbumRequest({ ...newAlbumRequest, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">Submit Request</button>
                <button type="button" onClick={() => setCurrentView('albums')} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    if (currentView === 'editAlbum' && isAdmin && editAlbum) {
      return (
        <div className="App">
          <nav className="navbar">
            <div className="nav-brand">🎵 Music Collection</div>
            <div className="nav-links">
              <button onClick={() => setCurrentView('albums')} className="nav-btn">Albums</button>
              <button onClick={handleViewMyReviews} className="nav-btn">My Reviews</button>
              <button onClick={() => setCurrentView('adminDashboard')} className="nav-btn">Admin</button>
              <span className="username-display">{username}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </nav>

          <div className="edit-album-container">
            <div className="page-header">
              <button onClick={() => setCurrentView('adminAlbums')} className="back-btn">← Back to Albums</button>
              <h1>Edit Album</h1>
            </div>
            <form onSubmit={handleUpdateAlbum} className="edit-album-form">
              <div className="form-group">
                <label>Album Title</label>
                <input
                  type="text"
                  value={editAlbum.title}
                  onChange={(e) => setEditAlbum({ ...editAlbum, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Release Year</label>
                <input
                  type="number"
                  value={editAlbum.release_year}
                  onChange={(e) => setEditAlbum({ ...editAlbum, release_year: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={editAlbum.image_url}
                  onChange={(e) => setEditAlbum({ ...editAlbum, image_url: e.target.value })}
                  required
                />
                {editAlbum.image_url && (
                  <div className="preview-container">
                    <img 
                      src={editAlbum.image_url} 
                      alt="Album preview" 
                      className="album-preview"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none', padding: '20px', textAlign: 'center', color: '#666' }}>
                      Image failed to load. Please check the URL.
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Video URL (YouTube)</label>
                <input
                  type="url"
                  value={editAlbum.video_url || ''}
                  onChange={(e) => setEditAlbum({ ...editAlbum, video_url: e.target.value })}
                />
                {editAlbum.video_url && (
                  <div className="preview-container">
                    <iframe
                      width="100%"
                      height="315"
                      src={editAlbum.video_url.replace('watch?v=', 'embed/')}
                      title="Video preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">Save Changes</button>
                <button type="button" onClick={() => setCurrentView('adminDashboard')} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    if (currentView === 'adminDashboard' && isAdmin) {
      return (
        <div className="App">
          <nav className="navbar">
            <div className="nav-brand">🎵 Music Collection</div>
            <div className="nav-links">
              <button onClick={() => setCurrentView('albums')} className="nav-btn">Albums</button>
              <button onClick={handleViewMyReviews} className="nav-btn">My Reviews</button>
              <button onClick={() => setCurrentView('adminDashboard')} className="nav-btn active">Admin</button>
              <span className="username-display">{username}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </nav>

          <div className="dashboard-container">
            <h1>Admin Dashboard</h1>
            <div className="dashboard-grid">
              <div className="dashboard-card" onClick={handleViewAdminAlbums}>
                <h3>Manage Albums</h3>
                <p>Add, edit, and delete albums</p>
              </div>
              <div className="dashboard-card" onClick={handleViewAllReviews}>
                <h3>Manage Reviews</h3>
                <p>View and moderate all reviews</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'adminAlbums' && isAdmin) {
      return (
        <div className="App">
          <nav className="navbar">
            <div className="nav-brand">🎵 Music Collection</div>
            <div className="nav-links">
              <button onClick={() => setCurrentView('albums')} className="nav-btn">Albums</button>
              <button onClick={handleViewMyReviews} className="nav-btn">My Reviews</button>
              <button onClick={() => setCurrentView('adminDashboard')} className="nav-btn active">Admin</button>
              <span className="username-display">{username}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </nav>

          <div className="admin-dashboard">
            <div className="page-header">
              <button onClick={() => setCurrentView('adminDashboard')} className="back-btn">← Back to Dashboard</button>
            </div>
            <div className="admin-header-bar">
              <h1>Manage Albums</h1>
              <button onClick={() => setCurrentView('addAlbum')} className="add-album-btn">+ Add New Album</button>
            </div>

            {albumRequests.length > 0 && (
              <div className="admin-section">
                <h2>Pending Album Requests ({albumRequests.length})</h2>
                <div className="album-requests-list">
                  {albumRequests.map((request) => (
                    <div key={request.request_id} className="admin-album-item request-item">
                      <div className="admin-album-info">
                        <div>
                          <h3>{request.title}</h3>
                          <p>{request.artist_name}</p>
                          <p className="request-meta">Requested by: {request.username}</p>
                          <p className="genre-year">{request.genre} • {request.release_year}</p>
                          {request.description && <p className="request-description">{request.description}</p>}
                        </div>
                      </div>
                      <div className="admin-album-actions">
                        <button onClick={() => handleViewRequest(request)} className="view-btn">View</button>
                        <button onClick={() => handleApproveRequest(request.request_id)} className="approve-btn">Approve</button>
                        <button onClick={() => handleDenyRequest(request.request_id)} className="deny-btn">Deny</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-section">
              <h2>All Albums</h2>
              <div className="album-list-admin">
                  {albums && albums.length > 0 ? (
                    albums.map((album) => (
                      <div key={album.album_id} className="admin-album-item">
                        <div className="admin-album-info">
                          <img src={album.image_url} alt={album.title} className="admin-album-thumb" />
                          <div>
                            <h3>{album.title}</h3>
                            <p>{album.artist_name}</p>
                          </div>
                        </div>
                        <div className="admin-album-actions">
                          <button onClick={() => handleEditAlbum(album)} className="edit-btn">Edit</button>
                          <button onClick={() => handleDeleteAlbum(album.album_id)} className="delete-btn">Delete</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No albums found</p>
                  )}
                </div>
              </div>
            </div>
        </div>
      );
    }

    return (
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">🎵 Music Collection</div>
          <div className="nav-links">
            <button onClick={() => setCurrentView('home')} className="nav-btn">Home</button>
            <button onClick={() => setCurrentView('albums')} className="nav-btn active">Albums</button>
            <button onClick={handleViewMyReviews} className="nav-btn">My Reviews</button>
            {isAdmin && <button onClick={() => setCurrentView('adminDashboard')} className="nav-btn">Admin</button>}
            <span className="username-display">{username}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </nav>

        <div className="albums-container">
          <div className="page-header">
            <h1>Albums</h1>
            {!isAdmin && (
              <button onClick={() => setCurrentView('requestAlbum')} className="add-album-btn">
                + Request Album
              </button>
            )}
          </div>
          <div className="albums-grid">
            {albums && albums.length > 0 ? (
              albums.map((album) => (
                <div key={album.album_id} className="album-card">
                  <img src={album.image_url} alt={album.title} />
                  <h3>{album.title}</h3>
                  <p>{album.artist_name}</p>
                  <p className="genre">{album.genre}</p>
                  <p className="year">{album.release_year}</p>
                  <button onClick={() => handleViewAlbum(album)} className="view-btn">View</button>
                </div>
              ))
            ) : (
              <p>No albums found</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback for logged-in users with unhandled views
  if (isLoggedIn) {
    return (
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">🎵 Music Collection</div>
          <div className="nav-links">
            <button onClick={() => setCurrentView('home')} className="nav-btn">Home</button>
            <button onClick={() => setCurrentView('albums')} className="nav-btn">Albums</button>
            <button onClick={handleViewMyReviews} className="nav-btn">My Reviews</button>
            {isAdmin && <button onClick={() => setCurrentView('adminDashboard')} className="nav-btn">Admin</button>}
            <span className="username-display">{username}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </nav>
        <div style={{padding: '20px'}}>
          <p>View not found. Redirecting to home...</p>
          {setCurrentView('home')}
        </div>
      </div>
    );
  }

  // Login/Register page for viewers
  if (currentView === 'login' || (!isLoggedIn && currentView !== 'home' && currentView !== 'albums')) {
    return (
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">🎵 Music Collection</div>
          <div className="nav-links">
            <button onClick={() => setCurrentView('home')} className="nav-btn">Home</button>
            <button onClick={() => setCurrentView('albums')} className="nav-btn">Albums</button>
          </div>
        </nav>

        <div className="welcome-container login-page">
          <div className="welcome-box">
            <h1>Welcome to Music Collection</h1>
            <p>Discover, collect, and review your favorite albums</p>
          
            <div className="auth-form">
              <div className="auth-toggle">
                <button 
                  className={isLogin ? 'active' : ''}
                  onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button 
                className={!isLogin ? 'active' : ''}
                onClick={() => setIsLogin(false)}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              )}
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button type="submit" className="submit-btn">
                {isLogin ? 'Login' : 'Register'}
              </button>
            </form>

            {message && <div className="message">{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
  }

  // Fallback: This should never be reached
  return <div className="App"><p>Loading...</p></div>;
}

export default App;



