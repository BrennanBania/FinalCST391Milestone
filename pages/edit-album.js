import EditAlbumPage from '../src/pages/EditAlbumPage';

export default function EditAlbum({ isAdmin, appState }) {
  if (!isAdmin) {
    return (
      <div className="page-container">
        <h1>Access Denied</h1>
        <p>You must be an admin to access this page.</p>
      </div>
    );
  }

  return (
    <EditAlbumPage
      artists={appState?.artists || []}
      appState={appState}
    />
  );
}
