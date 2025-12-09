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
        <Link href="/" passHref>
          <button className={`nav-btn${currentPath === '/' ? ' active' : ''}`}>
            Home
          </button>
        </Link>
        <Link href="/albums" passHref>
          <button className={`nav-btn${currentPath === '/albums' ? ' active' : ''}`}>
            Albums
          </button>
        </Link>
        {isLoggedIn && (
          <Link href="/my-reviews" passHref>
            <button className={`nav-btn${currentPath === '/my-reviews' ? ' active' : ''}`}>
              My Reviews
            </button>
          </Link>
        )}
        {isLoggedIn && isAdmin && (
          <Link href="/admin" passHref>
            <button className={`nav-btn${currentPath === '/admin' ? ' active' : ''}`}>
              Admin
            </button>
          </Link>
        )}
        {isLoggedIn && <span className="username-display">{username}</span>}
        {isLoggedIn && (
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        )}
        {!isLoggedIn && (
          <Link href="/login" passHref>
            <button className="logout-btn">
              Login
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
