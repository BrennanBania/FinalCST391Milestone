import { useEffect } from 'react';
import HomePage from '../src/pages/HomePage';

export default function Home({ topAlbums, isLoggedIn, appState, username }) {
  useEffect(() => {
    // Handle GitHub OAuth callback
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const username = params.get('username');
    const role = params.get('role');

    if (token && username) {
      // Store the token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      localStorage.setItem('isAdmin', role === 'admin' ? 'true' : 'false');
      
      // Clear URL parameters and reload
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    // Fetch data when appState is available
    if (appState?.fetchTopAlbums && appState?.fetchAlbums) {
      appState.fetchTopAlbums(true);
      appState.fetchAlbums(true);
    }
  }, [appState?.fetchTopAlbums, appState?.fetchAlbums])

  return (
    <HomePage
      topAlbums={appState?.topAlbums || []}
      albums={appState?.albums || []}
      onViewAlbum={(album) => {
        window.location.href = `/albums/${album.album_id}`;
      }}
      isLoggedIn={isLoggedIn}
      username={username}
    />
  );
}
