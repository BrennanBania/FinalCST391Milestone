import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

function Navigation({
  isLoggedIn,
  isAdmin,
  username,
  onNavigate,
  onLogout,
}) {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <nav className="navbar">
      <div className="nav-brand">🎵 Music Collection</div>
      <div className="nav-links">
        <Link href="/" className={`nav-btn${currentPath === '/' ? ' active' : ''}`}>
          Home
        </Link>
        <Link href="/albums" className={`nav-btn${currentPath === '/albums' ? ' active' : ''}`}>
          Albums
        </Link>
        {isLoggedIn && (
          <Link href="/my-reviews" className={`nav-btn${currentPath === '/my-reviews' ? ' active' : ''}`}>
            My Reviews
          </Link>
        )}
        {isLoggedIn && isAdmin && (
          <Link href="/admin" className={`nav-btn${currentPath === '/admin' ? ' active' : ''}`}>
            Admin
          </Link>
        )}
        {isLoggedIn && <span className="username-display">{username}</span>}
        {isLoggedIn && (
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        )}
        {!isLoggedIn && (
          <Link href="/login" className="logout-btn">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
