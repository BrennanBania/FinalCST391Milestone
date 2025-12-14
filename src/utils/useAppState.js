import { useState, useEffect, useCallback } from 'react';
import { getToken, decodeToken, API_BASE_URL } from './api';

export const useAppState = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [currentView, setCurrentView] = useState('home');
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingReviewData, setEditingReviewData] = useState({ rating: 5, reviewText: '' });
  const [newReview, setNewReview] = useState({ rating: 5, reviewText: '' });
  const [albumRequests, setAlbumRequests] = useState([]);
  const [editAlbum, setEditAlbum] = useState(null);
  const [flaggedSectionCollapsed, setFlaggedSectionCollapsed] = useState(false);

  // Cache timestamps to prevent redundant API calls
  const [lastFetchTimes, setLastFetchTimes] = useState({
    albums: 0,
    artists: 0,
    topAlbums: 0
  });
  const CACHE_DURATION = 60000; // 1 minute cache

  // Initialize auth state
  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setUsername(decoded.username);
        setIsAdmin(decoded.role === 'admin');
        setIsLoggedIn(true);
      }
    }
  }, []);

  const fetchAlbums = useCallback(async (force = false) => {
    if (!force && albums.length > 0) {
      // Use cached data
      return;
    }

    const now = Date.now();
    try {
      // Fetch all albums without pagination (limit=1000 to get all)
      const response = await fetch(`${API_BASE_URL}/api/albums?limit=1000`);
      const data = await response.json();
      setAlbums(Array.isArray(data) ? data : data.albums || []);
      setLastFetchTimes(prev => ({ ...prev, albums: now }));
    } catch (error) {
      console.error('Error fetching albums:', error);
      setAlbums([]);
    }
  }, []);

  const fetchArtists = useCallback(async (force = false) => {
    if (!force && artists.length > 0) {
      return; // Use cached data
    }

    const now = Date.now();
    try {
      const response = await fetch(`${API_BASE_URL}/api/artists`);
      const data = await response.json();
      setArtists(Array.isArray(data) ? data : data.artists || []);
      setLastFetchTimes(prev => ({ ...prev, artists: now }));
    } catch (error) {
      console.error('Error fetching artists:', error);
      setArtists([]);
    }
  }, []);

  const fetchTopAlbums = useCallback(async (force = false) => {
    if (!force && topAlbums.length > 0) {
      return; // Use cached data
    }

    const now = Date.now();
    try {
      const response = await fetch(`${API_BASE_URL}/api/albums/top`);
      const data = await response.json();
      setTopAlbums(data);
      setLastFetchTimes(prev => ({ ...prev, topAlbums: now }));
    } catch (error) {
      console.error('Error fetching top albums:', error);
      setTopAlbums([]);
    }
  }, []);

  const fetchReviews = useCallback(async (albumId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/albums/${albumId}/reviews`);
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  }, []);

  const fetchMyReviews = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const userId = decodeToken(token)?.userId;
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMyReviews(data || []);
    } catch (error) {
      console.error('Error fetching my reviews:', error);
      setMyReviews([]);
    }
  }, []);

  const fetchAllReviews = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setAllReviews([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch reviews:', response.status);
        setAllReviews([]);
        return;
      }
      
      const data = await response.json();
      setAllReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      setAllReviews([]);
    }
  }, []);

  const fetchAlbumRequests = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setAlbumRequests([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/album-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch album requests:', response.status);
        setAlbumRequests([]);
        return;
      }
      
      const data = await response.json();
      setAlbumRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching album requests:', error);
      setAlbumRequests([]);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchAlbums();
    fetchArtists();
    fetchTopAlbums();
  }, [fetchAlbums, fetchArtists, fetchTopAlbums]);

  return {
    // Auth
    isLoggedIn,
    setIsLoggedIn,
    isAdmin,
    setIsAdmin,
    username,
    setUsername,
    // Navigation
    currentView,
    setCurrentView,
    // Albums
    albums,
    setAlbums,
    fetchAlbums,
    artists,
    setArtists,
    fetchArtists,
    topAlbums,
    setTopAlbums,
    fetchTopAlbums,
    selectedAlbum,
    setSelectedAlbum,
    editAlbum,
    setEditAlbum,
    // Reviews
    reviews,
    setReviews,
    fetchReviews,
    myReviews,
    setMyReviews,
    fetchMyReviews,
    allReviews,
    setAllReviews,
    fetchAllReviews,
    newReview,
    setNewReview,
    editingReviewId,
    setEditingReviewId,
    editingReviewData,
    setEditingReviewData,
    // Requests
    albumRequests,
    setAlbumRequests,
    fetchAlbumRequests,
    // UI
    flaggedSectionCollapsed,
    setFlaggedSectionCollapsed,
  };
};
