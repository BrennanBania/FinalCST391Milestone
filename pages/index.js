import { useEffect } from 'react';
import HomePage from '../src/pages/HomePage';

export default function Home({ topAlbums, isLoggedIn, appState }) {
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

  return (
    <HomePage
      topAlbums={appState?.topAlbums || []}
      onViewAlbum={(album) => {
        window.location.href = `/albums/${album.album_id}`;
      }}
      isLoggedIn={isLoggedIn}
    />
  );
}
