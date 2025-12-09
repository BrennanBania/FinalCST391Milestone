import MyReviewsPage from '../src/pages/MyReviewsPage';

export default function MyReviews({ appState }) {
  return (
    <MyReviewsPage
      reviews={appState?.myReviews || []}
      appState={appState}
    />
  );
}
