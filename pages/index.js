import HomePage from '../src/pages/HomePage';

export default function Home({ topAlbums, isLoggedIn, appState }) {
  return (
    <HomePage
      topAlbums={appState?.topAlbums || []}
      onViewAlbum={(album) => {
        window.location.href = `/albums/${album.album_id}`;
      }}
      isLoggedIn={isLoggedIn}
    />
  );
}
