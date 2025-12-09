import { useRouter } from 'next/router';
import AlbumDetailPage from '../../src/pages/AlbumDetailPage';

export default function AlbumDetail({ isLoggedIn, isAdmin, username, appState }) {
  const router = useRouter();
  const { id } = router.query;

  // Don't render until we have the ID from the router
  if (!id) {
    return <div>Loading...</div>;
  }

  return (
    <AlbumDetailPage
      albumId={id}
      isLoggedIn={isLoggedIn}
      isAdmin={isAdmin}
      username={username}
      appState={appState}
      onNavigate={(path) => router.push(path)}
    />
  );
}

// This tells Next.js not to pre-render this page at build time
export async function getServerSideProps() {
  return {
    props: {},
  };
}
