import AdminDashboard from '../src/pages/AdminDashboard';

export default function Admin({ isAdmin, username, appState }) {
  if (!isAdmin) {
    return (
      <div className="page-container">
        <h1>Access Denied</h1>
        <p>You must be an admin to access this page.</p>
      </div>
    );
  }

  return (
    <AdminDashboard
      isAdmin={isAdmin}
      username={username}
      albumRequests={appState?.albumRequests || []}
      appState={appState}
    />
  );
}
