import { useRouter } from 'next/router';
import AlbumsPage from '../src/pages/AlbumsPage';

export default function Albums({ albums, isLoggedIn, isAdmin, appState }) {
  const router = useRouter();

  return (
    <AlbumsPage
      albums={appState?.albums || []}
      isLoggedIn={isLoggedIn}
      isAdmin={isAdmin}
      onViewAlbum={(album) => router.push(`/albums/${album.album_id}`)}
      onNavigate={(path) => router.push(path)}
    />
  );
}
