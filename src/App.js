import React, { useEffect, useState } from 'react';
import Navigation from './components/Navigation';
import { useAppState } from './utils/useAppState';
import { decodeToken } from './utils/api';
import HomePage from './pages/HomePage';
import AlbumsPage from './pages/AlbumsPage';
import AlbumDetailPage from './pages/AlbumDetailPage';
import LoginPage from './pages/LoginPage';
import MyReviewsPage from './pages/MyReviewsPage';
import AdminDashboard from './pages/AdminDashboard';
import AllReviewsPage from './pages/AllReviewsPage';
import EditAlbumPage from './pages/EditAlbumPage';
import RequestAlbumPage from './pages/RequestAlbumPage';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  const appState = useAppState();

  // Initialize on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedAdmin = localStorage.getItem('isAdmin') === 'true';
    const storedUsername = localStorage.getItem('username');
    
    if (token) {
      try {
        const decoded = decodeToken(token);
        if (decoded) {
          setIsLoggedIn(true);
          setUsername(storedUsername || decoded.username);
          setIsAdmin(storedAdmin || decoded.role === 'admin');
        }
      } catch (error) {
        console.error('Token decode error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('username');
      }
    }
    // Fetch initial data
    appState.fetchAlbums();
    appState.fetchArtists();
  }, []);

  const handleNavigate = (view) => {
    setCurrentView(view);
    setSelectedAlbum(null);
  };

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('isAdmin', user.role === 'admin' ? 'true' : 'false');
    localStorage.setItem('username', user.username);
    setIsLoggedIn(true);
    setUsername(user.username);
    setIsAdmin(user.role === 'admin');
    setCurrentView('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUsername('');
    setCurrentView('home');
  };

  const handleViewAlbum = (album) => {
    setSelectedAlbum(album);
    setCurrentView('album-detail');
    
    // Track recently viewed albums
    if (isLoggedIn && album.album_id) {
      const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const filtered = viewed.filter(id => id !== album.album_id);
      const updated = [album.album_id, ...filtered].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    }
  };

  const renderPage = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomePage
            topAlbums={appState.topAlbums}
            onViewAlbum={handleViewAlbum}
            isLoggedIn={isLoggedIn}
            username={username}
            albums={appState.albums}
          />
        );
      case 'albums':
        return (
          <AlbumsPage
            albums={appState.albums}
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            onViewAlbum={handleViewAlbum}
            onNavigate={handleNavigate}
          />
        );
      case 'album-detail':
        return selectedAlbum ? (
          <AlbumDetailPage
            album={selectedAlbum}
            isLoggedIn={isLoggedIn}
            username={username}
            appState={appState}
            onBack={() => handleNavigate('albums')}
          />
        ) : null;
      case 'login':
        return (
          <LoginPage
            onLogin={handleLogin}
          />
        );
      case 'my-reviews':
        return (
          <MyReviewsPage
            reviews={appState.myReviews}
            appState={appState}
          />
        );
      case 'admin':
        return (
          <AdminDashboard
            albumRequests={appState.albumRequests}
            appState={appState}
            onNavigate={handleNavigate}
          />
        );
      case 'all-reviews':
        return (
          <AllReviewsPage
            reviews={appState.allReviews}
            isAdmin={isAdmin}
            username={username}
            appState={appState}
          />
        );
      case 'edit-album':
        return (
          <EditAlbumPage
            appState={appState}
            onNavigate={handleNavigate}
          />
        );
      case 'request-album':
        return (
          <RequestAlbumPage
            appState={appState}
            onNavigate={handleNavigate}
          />
        );
      default:
        return (
          <HomePage
            topAlbums={appState.topAlbums}
            onViewAlbum={handleViewAlbum}
          />
        );
    }
  };

  return (
    <div className="App">
      <Navigation
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        username={username}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onLogin={() => handleNavigate('login')}
      />
      <div className="content">
        {renderPage()}
      </div>
    </div>
  );
}

export default App;



