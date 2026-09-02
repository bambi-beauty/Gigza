// UserContext/ThisUserContext.js
// COMPLETE FIXED VERSION

import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from "react";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const initialAuthCheckDone = useRef(false);
  const BASE_API = 'https://gigza-testing-11.onrender.com/api';

  // ========== HELPER: Get token ==========
  const getToken = useCallback(() => {
    // ✅ Primary source: localStorage
    const localToken = localStorage.getItem('token');
    if (localToken) {
      return localToken;
    }
    
    // ✅ Fallback: sessionStorage
    const sessionToken = sessionStorage.getItem('token');
    if (sessionToken) {
      return sessionToken;
    }
    
    return null;
  }, []);

  // ========== HELPER: Set token ==========
  const setToken = useCallback((token) => {
    if (token) {
      localStorage.setItem('token', token);
      console.log('✅ Token stored in localStorage');
    }
  }, []);

  // ========== HELPER: Remove token ==========
  const removeToken = useCallback(() => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    console.log('🗑️ Token removed');
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

  // ========== HELPER: API fetch with authentication ==========
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
    
    console.log(`📡 API Call: ${options.method || 'GET'} ${BASE_API}${url}`);
    console.log('🔑 Token present:', !!token);
    
    const response = await fetch(`${BASE_API}${url}`, {
      ...options,
      credentials: 'include',
      headers: headers
    });
    
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Token may be invalid or expired');
      // Don't auto-clear here - let the caller handle it
    }
    
    return response;
  }, [getToken]);

  // ========== CLEAR AUTH DATA ==========
  const clearAuthData = useCallback(() => {
    sessionStorage.removeItem("verificationEmail");
    sessionStorage.removeItem("pendingUserName");
    removeToken();
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
    setUser(null);
    setIsAuthenticated(false);
    setRequiresVerification(false);
    setVerificationEmail(null);
    setError(null);
    console.log('🧹 Auth data cleared');
  }, [removeToken]);

  // ========== SET AUTH DATA ==========
  const setAuthData = useCallback((userData, token = null) => {
    if (token) {
      setToken(token);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
    
    setUser(userData);
    setIsAuthenticated(true);
    setRequiresVerification(false);
    setVerificationEmail(null);
    sessionStorage.removeItem("verificationEmail");
    sessionStorage.removeItem("pendingUserName");
    console.log('✅ Auth data set for user:', userData.email || userData.username);
  }, [setToken]);

  // ========== CHECK AUTH STATUS ==========
  const checkAuthStatus = useCallback(async () => {
    try {
      const token = getToken();
      
      if (!token) {
        console.log('❌ No token found');
        clearAuthData();
        return false;
      }

      console.log('🔍 Validating session with token...');

      const response = await apiFetch('/auth/profile', {
        method: 'GET'
      });

      console.log('📥 Profile response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('⚠️ Session expired');
          clearAuthData();
          return false;
        }
        throw new Error('Failed to validate session');
      }

      const data = await response.json();
      
      if (data.success) {
        const userData = data.data?.user || data.data || data.user;
        
        if (userData) {
          console.log('✅ User authenticated:', userData.email || userData.username);
          setUser(userData);
          setIsAuthenticated(true);
          
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('isAuthenticated', 'true');
          
          if (userData.email_verified === false) {
            setRequiresVerification(true);
            setVerificationEmail(userData.email);
          }
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Auth validation failed:", error);
      clearAuthData();
      return false;
    }
  }, [getToken, apiFetch, clearAuthData]);

  // ========== INITIALIZATION ==========
  useEffect(() => {
    if (initialAuthCheckDone.current) return;
    initialAuthCheckDone.current = true;

    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        const pendingEmail = sessionStorage.getItem("verificationEmail");
        if (pendingEmail) {
          setVerificationEmail(pendingEmail);
          setRequiresVerification(true);
        }

        const token = getToken();
        console.log('🔍 Initial auth check - token exists:', !!token);
        
        if (!token) {
          console.log('❌ No token, clearing auth');
          clearAuthData();
          setLoading(false);
          return;
        }

        await checkAuthStatus();
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [checkAuthStatus, getToken]);

  // ========== LOGIN ==========
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    setRequiresVerification(false);
    
    try {
      console.log('📝 Attempting login for:', email);
      
      const response = await fetch(`${BASE_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      console.log('📥 Login response status:', response.status);
      console.log('📥 Token in response:', data.token ? '✅ YES' : '❌ NO');
      
      if (!response.ok) {
        if (response.status === 403 && data.requiresVerification) {
          sessionStorage.setItem("verificationEmail", email);
          setVerificationEmail(email);
          setRequiresVerification(true);
          return { 
            success: false, 
            requiresVerification: true,
            message: data.message || "Please verify your email first.",
            email: email
          };
        }
        throw new Error(data.message || 'Login failed');
      }
      
      if (data.success) {
        const userData = data.user || data.data;
        const token = data.token || null;
        
        if (!token) {
          console.warn('⚠️ No token returned from login!');
        }
        
        if (userData) {
          setAuthData(userData, token);
          return { success: true, user: userData };
        }
        throw new Error(data.message || 'Login failed - no user data');
      } else {
        throw new Error(data.message || 'Login failed');
      }
      
    } catch (error) {
      console.error("Login failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== SIGNUP ==========
  const signup = async (username, email, password) => {
    setError(null);
    setLoading(true);
    setRequiresVerification(false);
    
    try {
      const response = await fetch(`${BASE_API}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      console.log('📥 Signup response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      if (data.success) {
        if (data.requiresVerification) {
          sessionStorage.setItem("verificationEmail", email);
          sessionStorage.setItem("pendingUserName", username);
          setVerificationEmail(email);
          setRequiresVerification(true);
          
          return { 
            success: true, 
            requiresVerification: true,
            message: data.message || "Please verify your email with the OTP sent.",
            email: email
          };
        }
        
        const token = data.token || null;
        const userData = data.user || data.data;
        
        if (userData) {
          setAuthData(userData, token);
          return { 
            success: true, 
            message: "Account created successfully!",
            user: userData
          };
        }
        
        throw new Error(data.message || 'Signup failed - unexpected response');
      } else {
        throw new Error(data.message || 'Signup failed');
      }
      
    } catch (error) {
      console.error("Signup failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== VERIFY OTP ==========
  const verifyOTP = async (email, otp) => {
    setError(null);
    setIsVerifying(true);
    
    try {
      const response = await fetch(`${BASE_API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }
      
      if (data.success) {
        const userData = data.user || data.data;
        const token = data.token || null;
        
        if (userData) {
          setAuthData(userData, token);
          return { 
            success: true, 
            message: data.message || "Email verified successfully!",
            user: userData
          };
        }
        throw new Error(data.message || 'OTP verification failed - no user data');
      } else {
        throw new Error(data.message || 'OTP verification failed');
      }
      
    } catch (error) {
      console.error("OTP verification failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsVerifying(false);
    }
  };

  // ========== RESEND OTP ==========
  const resendOTP = async (email) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch(`${BASE_API}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }
      
      return { 
        success: true, 
        message: data.message || "New OTP sent to your email."
      };
      
    } catch (error) {
      console.error("Resend OTP failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== GOOGLE LOGIN ==========
  const googleLogin = async (email, name, googleId) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch(`${BASE_API}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, name, googleId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Google login failed');
      }
      
      if (data.success) {
        const userData = data.user || data.data;
        const token = data.token || null;
        
        if (userData) {
          setAuthData(userData, token);
          return { success: true, user: userData };
        }
        throw new Error(data.message || 'Google login failed - no user data');
      } else {
        throw new Error(data.message || 'Google login failed');
      }
      
    } catch (error) {
      console.error("Google login failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== LOGOUT ==========
  const logout = useCallback(async () => {
    try {
      const response = await apiFetch('/auth/logout', {
        method: 'POST'
      });
      
      if (!response.ok) {
        console.warn('Logout API returned error:', response.status);
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      clearAuthData();
    }
  }, [apiFetch, clearAuthData]);

  // ========== PROFILE METHODS ==========
  const completeProfile = async (userid, profileData) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await apiFetch('/auth/complete-profile', {
        method: 'PUT',
        body: JSON.stringify({ userid, ...profileData })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          await logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(data.message || 'Profile completion failed');
      }
      
      if (data.success) {
        if (user) {
          const updatedUser = { ...user, ...profileData };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return { success: true, profile: data.profile };
      } else {
        throw new Error(data.message || 'Profile completion failed');
      }
      
    } catch (error) {
      console.error("Profile completion failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getUserProfile = async () => {
    try {
      const response = await apiFetch('/auth/profile', {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const userData = data.data?.user || data.data || data;
        if (userData) {
          setUser(prev => ({ ...prev, ...userData }));
          localStorage.setItem('user', JSON.stringify({ ...user, ...userData }));
        }
        return userData;
      }
      
      if (response.status === 401) {
        await logout();
        return null;
      }
      
      return null;
    } catch (error) {
      console.error("Get profile failed:", error);
      return null;
    }
  };

  const updateProfile = async (profileData) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          await logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(data.message || 'Profile update failed');
      }
      
      if (data.success && data.profile) {
        if (user) {
          const updatedUser = { ...user, ...data.profile };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return { success: true, profile: data.profile };
      } else {
        throw new Error(data.message || 'Profile update failed');
      }
      
    } catch (error) {
      console.error("Profile update failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

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

  // ========== CLEAR VERIFICATION STATE ==========
  const clearVerificationState = useCallback(() => {
    setRequiresVerification(false);
    setVerificationEmail(null);
    sessionStorage.removeItem("verificationEmail");
    sessionStorage.removeItem("pendingUserName");
  }, []);

  // ========== REFRESH SESSION ==========
  const refreshSession = useCallback(async () => {
    try {
      const response = await apiFetch('/auth/refresh', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('isAuthenticated', 'true');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Session refresh failed:", error);
      return false;
    }
  }, [apiFetch]);

  // ========== CONTEXT VALUE ==========
  const value = {
    // State
    user,
    loading,
    error,
    isAuthenticated,
    requiresVerification,
    verificationEmail,
    isVerifying,
    
    // Token helpers
    getToken,
    getAuthHeaders,
    apiFetch,
    setToken,
    removeToken,
    
    // Auth methods
    login,
    signup,
    googleLogin,
    logout,
    refreshSession,
    checkAuthStatus,
    
    // OTP methods
    verifyOTP,
    resendOTP,
    
    // Profile methods
    completeProfile,
    getUserProfile,
    updateProfile,
    
    // DJ methods
    applyToBecomeDJ,
    getDJApplicationStatus,
    
    // Utility
    setError,
    clearAuthData,
    clearVerificationState,
    setAuthData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};