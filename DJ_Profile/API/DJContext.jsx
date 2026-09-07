// UserContext/DJContext.js - Complete DJ Context
import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from "react";

const DJContext = createContext();

export const useDJ = () => {
  const context = useContext(DJContext);
  if (!context) {
    throw new Error("useDJ must be used within a DJProvider");
  }
  return context;
};

export const DJProvider = ({ children }) => {
  const [djProfile, setDjProfile] = useState(null);
  const [djApplications, setDjApplications] = useState([]);
  const [djGigs, setDjGigs] = useState([]);
  const [djEarnings, setDjEarnings] = useState(0);
  const [djStats, setDjStats] = useState({
    total_bookings: 0,
    total_reviews: 0,
    average_rating: 0,
    upcoming_gigs: 0,
    completed_gigs: 0
  });
  const [djPortfolio, setDjPortfolio] = useState([]);
  const [djSettings, setDjSettings] = useState({
    is_online: true,
    price_per_hour: 0,
    availability: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDj, setIsDj] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [bookingRequests, setBookingRequests] = useState([]);
  
  const initialCheckDone = useRef(false);
  const BASE_API = 'https://gigza-testing-11.onrender.com/api';

  // ========== HELPER: Get token ==========
  const getToken = useCallback(() => {
    const localToken = localStorage.getItem('token');
    if (localToken) return localToken;
    const sessionToken = sessionStorage.getItem('token');
    if (sessionToken) return sessionToken;
    return null;
  }, []);

  // ========== HELPER: Get auth headers ==========
  const getAuthHeaders = useCallback(() => {
    const token = getToken();
    const headers = { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [getToken]);



// ========== DJ FUNCTIONS ==========
  const applyToBecomeDJ = async (applicationData) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await apiFetch('/dj/apply', {
        method: 'POST',
        body: JSON.stringify(applicationData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          await logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(data.message || 'Application failed');
      }
      
      return { success: true, application: data.application };
    } catch (error) {
      console.error("DJ application failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getDJApplicationStatus = async () => {
    try {
      const response = await apiFetch('/dj/application-status', {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        return { success: true, application: data.application };
      }
      
      if (response.status === 401) {
        await logout();
        return { success: false, application: null, error: 'Session expired' };
      }
      
      return { success: false, application: null };
    } catch (error) {
      console.error("Get DJ application status failed:", error);
      return { success: false, error: error.message };
    }
  };


  // ========== HELPER: API fetch ==========
  const apiFetch = useCallback(async (url, options = {}) => {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_API}${url}`, {
      ...options,
      credentials: 'include',
      headers: headers
    });
    
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Token may be invalid or expired');
    }
    
    return response;
  }, [getToken]);

  // ========== CLEAR DJ DATA ==========
  const clearDJData = useCallback(() => {
    setDjProfile(null);
    setDjApplications([]);
    setDjGigs([]);
    setDjEarnings(0);
    setDjStats({
      total_bookings: 0,
      total_reviews: 0,
      average_rating: 0,
      upcoming_gigs: 0,
      completed_gigs: 0
    });
    setDjPortfolio([]);
    setBookingRequests([]);
    setIsDj(false);
    setApplicationStatus(null);
    localStorage.removeItem('djProfile');
    localStorage.removeItem('djData');
    console.log('🧹 DJ data cleared');
  }, []);

  // ========== SET DJ DATA ==========
  const setDJData = useCallback((data) => {
    if (data) {
      setDjProfile(data);
      setIsDj(true);
      localStorage.setItem('djProfile', JSON.stringify(data));
      console.log('✅ DJ data set');
    }
  }, []);

  // ========== LOAD DJ PROFILE ==========
  const loadDJProfile = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        console.log('❌ No token found');
        return false;
      }

      console.log('🔍 Loading DJ profile...');

      const response = await apiFetch('/dj/profile', {
        method: 'GET'
      });

      if (response.status === 404) {
        console.log('ℹ️ No DJ profile found');
        return false;
      }

      const data = await response.json();

      if (data.success && data.dj_profile) {
        setDjProfile(data.dj_profile);
        setIsDj(true);
        localStorage.setItem('djProfile', JSON.stringify(data.dj_profile));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error loading DJ profile:", error);
      return false;
    }
  }, [apiFetch, getToken]);

  // ========== CHECK DJ APPLICATION STATUS ==========
  const checkApplicationStatus = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return null;

      const response = await apiFetch('/dj/application-status', {
        method: 'GET'
      });

      if (response.status === 404) {
        return null;
      }

      const data = await response.json();

      if (data.success) {
        setApplicationStatus(data.application);
        return data.application;
      }
      
      return null;
    } catch (error) {
      console.error("Error checking application status:", error);
      return null;
    }
  }, [apiFetch, getToken]);

  // ========== GET DJ GIGS ==========
  const getDJGigs = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return { success: false, gigs: [] };

      const response = await apiFetch('/dj/gigs', {
        method: 'GET'
      });

      const data = await response.json();

      if (data.success) {
        setDjGigs(data.gigs || []);
        return { success: true, gigs: data.gigs };
      }
      
      return { success: false, gigs: [] };
    } catch (error) {
      console.error("Error fetching DJ gigs:", error);
      return { success: false, gigs: [] };
    }
  }, [apiFetch, getToken]);

  // ========== GET DJ EARNINGS ==========
  const getDJEarnings = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return { success: false, earnings: 0 };

      const response = await apiFetch('/dj/earnings', {
        method: 'GET'
      });

      const data = await response.json();

      if (data.success) {
        setDjEarnings(data.total_earnings || 0);
        return { success: true, earnings: data.total_earnings };
      }
      
      return { success: false, earnings: 0 };
    } catch (error) {
      console.error("Error fetching DJ earnings:", error);
      return { success: false, earnings: 0 };
    }
  }, [apiFetch, getToken]);

  // ========== GET DJ STATS ==========
  const getDJStats = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return { success: false, stats: null };

      const response = await apiFetch('/dj/stats', {
        method: 'GET'
      });

      const data = await response.json();

      if (data.success) {
        setDjStats(data.stats || {
          total_bookings: 0,
          total_reviews: 0,
          average_rating: 0,
          upcoming_gigs: 0,
          completed_gigs: 0
        });
        return { success: true, stats: data.stats };
      }
      
      return { success: false, stats: null };
    } catch (error) {
      console.error("Error fetching DJ stats:", error);
      return { success: false, stats: null };
    }
  }, [apiFetch, getToken]);

  // ========== GET BOOKING REQUESTS ==========
  const getBookingRequests = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return { success: false, requests: [] };

      const response = await apiFetch('/dj/booking-requests', {
        method: 'GET'
      });

      const data = await response.json();

      if (data.success) {
        setBookingRequests(data.requests || []);
        return { success: true, requests: data.requests };
      }
      
      return { success: false, requests: [] };
    } catch (error) {
      console.error("Error fetching booking requests:", error);
      return { success: false, requests: [] };
    }
  }, [apiFetch, getToken]);

  // ========== ACCEPT BOOKING ==========
  const acceptBooking = useCallback(async (bookingId) => {
    try {
      const token = getToken();
      if (!token) return { success: false };

      const response = await apiFetch(`/dj/bookings/${bookingId}/accept`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (data.success) {
        // Refresh booking requests
        await getBookingRequests();
        return { success: true, booking: data.booking };
      }
      
      return { success: false };
    } catch (error) {
      console.error("Error accepting booking:", error);
      return { success: false };
    }
  }, [apiFetch, getToken, getBookingRequests]);

  // ========== REJECT BOOKING ==========
  const rejectBooking = useCallback(async (bookingId) => {
    try {
      const token = getToken();
      if (!token) return { success: false };

      const response = await apiFetch(`/dj/bookings/${bookingId}/reject`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (data.success) {
        await getBookingRequests();
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error("Error rejecting booking:", error);
      return { success: false };
    }
  }, [apiFetch, getToken, getBookingRequests]);

  // ========== UPDATE DJ PROFILE ==========
  const updateDJProfile = useCallback(async (profileData) => {
    setError(null);
    setLoading(true);
    
    try {
      const token = getToken();
      if (!token) {
        setError("Not authenticated");
        return { success: false };
      }

      const response = await apiFetch('/dj/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (data.success) {
        setDjProfile(data.profile || data.dj_profile);
        return { success: true, profile: data.profile || data.dj_profile };
      }
      
      return { success: false, error: data.message };
    } catch (error) {
      console.error("Error updating DJ profile:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [apiFetch, getToken]);

  // ========== UPDATE DJ SETTINGS ==========
  const updateDJSettings = useCallback(async (settings) => {
    try {
      const token = getToken();
      if (!token) return { success: false };

      const response = await apiFetch('/dj/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        setDjSettings(prev => ({ ...prev, ...settings }));
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error("Error updating DJ settings:", error);
      return { success: false };
    }
  }, [apiFetch, getToken]);

  // ========== GET DJ PORTFOLIO ==========
  const getDJPortfolio = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return { success: false, portfolio: [] };

      const response = await apiFetch('/dj/portfolio', {
        method: 'GET'
      });

      const data = await response.json();

      if (data.success) {
        setDjPortfolio(data.portfolio || []);
        return { success: true, portfolio: data.portfolio };
      }
      
      return { success: false, portfolio: [] };
    } catch (error) {
      console.error("Error fetching DJ portfolio:", error);
      return { success: false, portfolio: [] };
    }
  }, [apiFetch, getToken]);

  // ========== ADD PORTFOLIO ITEM ==========
  const addPortfolioItem = useCallback(async (itemData) => {
    try {
      const token = getToken();
      if (!token) return { success: false };

      const response = await apiFetch('/dj/portfolio', {
        method: 'POST',
        body: JSON.stringify(itemData)
      });

      const data = await response.json();

      if (data.success) {
        await getDJPortfolio();
        return { success: true, item: data.item };
      }
      
      return { success: false };
    } catch (error) {
      console.error("Error adding portfolio item:", error);
      return { success: false };
    }
  }, [apiFetch, getToken, getDJPortfolio]);

  // ========== REMOVE PORTFOLIO ITEM ==========
  const removePortfolioItem = useCallback(async (itemId) => {
    try {
      const token = getToken();
      if (!token) return { success: false };

      const response = await apiFetch(`/dj/portfolio/${itemId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await getDJPortfolio();
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error("Error removing portfolio item:", error);
      return { success: false };
    }
  }, [apiFetch, getToken, getDJPortfolio]);


  

  // ========== TOGGLE ONLINE STATUS ==========
  const toggleOnlineStatus = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return { success: false };

      const newStatus = !djSettings.is_online;
      const response = await apiFetch('/dj/online-status', {
        method: 'PUT',
        body: JSON.stringify({ is_online: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        setDjSettings(prev => ({ ...prev, is_online: newStatus }));
        return { success: true, is_online: newStatus };
      }
      
      return { success: false };
    } catch (error) {
      console.error("Error toggling online status:", error);
      return { success: false };
    }
  }, [apiFetch, getToken, djSettings.is_online]);

  // ========== INITIALIZATION ==========
  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    const initializeDJ = async () => {
      setLoading(true);
      
      try {
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        // Check if user is a DJ
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.role_id === 2 || user.usertype === 'dj') {
            setIsDj(true);
            await loadDJProfile();
            await checkApplicationStatus();
            await getDJStats();
            await getBookingRequests();
          }
        }
      } catch (error) {
        console.error("DJ initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeDJ();
  }, [getToken, loadDJProfile, checkApplicationStatus, getDJStats, getBookingRequests]);

  // ========== CONTEXT VALUE ==========
  const value = {
    // State
    djProfile,
    djApplications,
    djGigs,
    djEarnings,
    djStats,
    djPortfolio,
    djSettings,
    loading,
    error,
    isDj,
    applicationStatus,
    bookingRequests,
    
    // Getters
    loadDJProfile,
    checkApplicationStatus,
    getDJGigs,
    getDJEarnings,
    getDJStats,
    getBookingRequests,
    getDJPortfolio,
    
    // Actions
    applyToBecomeDJ,
    acceptBooking,
    rejectBooking,
    updateDJProfile,
    updateDJSettings,
    addPortfolioItem,
    removePortfolioItem,
    toggleOnlineStatus,
    
    // Utility
    setError,
    clearDJData,
    setDJData
  };

  return (
    <DJContext.Provider value={value}>
      {children}
    </DJContext.Provider>
  );
};