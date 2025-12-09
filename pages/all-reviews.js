import AllReviewsPage from '../src/pages/AllReviewsPage';

export default function AllReviews({ isAdmin, username, appState }) {
  return (
    <AllReviewsPage
      reviews={appState?.allReviews || []}
      isAdmin={isAdmin}
      username={username}
      appState={appState}
    />
  );
}
