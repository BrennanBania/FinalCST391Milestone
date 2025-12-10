import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import AlbumDetailPage from '../../src/pages/AlbumDetailPage';
import { fetchAPI } from '../../src/utils/api';

export default function AlbumDetail({ isLoggedIn, isAdmin, username, appState }) {
  const router = useRouter();
  const { id } = router.query;
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAlbum();
    }
  }, [id]);

  const fetchAlbum = async () => {
    try {
      setLoading(true);
      const response = await fetchAPI(`/api/albums/${id}`);
      if (response.ok) {
        // The API returns { album: {...}, tracks: [...], ... }
        setAlbum(response.data.album || response.data);
      } else {
        console.error('Error fetching album:', response.error);
      }
    } catch (error) {
      console.error('Error fetching album:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !album) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <AlbumDetailPage
      album={album}
      isLoggedIn={isLoggedIn}
      isAdmin={isAdmin}
      username={username}
      appState={appState}
      onBack={() => router.push('/albums')}
    />
  );
}
