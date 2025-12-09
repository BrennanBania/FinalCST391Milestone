import RequestAlbumPage from '../src/pages/RequestAlbumPage';

export default function RequestAlbum({ isLoggedIn, appState }) {
  if (!isLoggedIn) {
    return (
      <div className="page-container">
        <h1>Access Denied</h1>
        <p>You must be logged in to request an album.</p>
      </div>
    );
  }

  return (
    <RequestAlbumPage
      artists={appState?.artists || []}
      appState={appState}
    />
  );
}
