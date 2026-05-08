import React, { useState, createContext, useContext, useEffect, useCallback } from "react";

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
  
  // Base API URL
  const BASE_API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Helper function to make fetch requests
  const fetchWithNgrok = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...options.headers,
    };

    // Add token if available
    const token = localStorage.getItem("token");
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log(`📡 ${options.method || 'GET'} request to:`, url);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(`📡 Response status: ${response.status}`);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Token might be expired
        const data = await response.json().catch(() => ({}));
        if (data.message?.includes('expired') || data.message?.includes('invalid')) {
          logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      // Check content type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse.substring(0, 200));
        throw new Error(`Server error. Please try again.`);
      }

      return response;
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log("✅ Auth initialized from localStorage");
        } catch (err) {
          console.error("Failed to parse user data:", err);
          clearAuthData();
        }
      }
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  // Clear auth data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("verificationEmail");
    localStorage.removeItem("pendingUserName");
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // ========== SIGNUP ==========
  const signup = async (username, email, password) => {
    setError(null);
    setLoading(true);
    
    try {
      console.log("📝 Signing up user:", { username, email });
      
      const response = await fetchWithNgrok(`${BASE_API}/auth/signup`, {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      console.log("Signup response:", data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      if (data.success) {
        // Store email temporarily for OTP verification
        localStorage.setItem("verificationEmail", email);
        localStorage.setItem("pendingUserName", username);
        
        return { 
          success: true, 
          message: "Verification code sent to your email",
          user: data.user,
          nextStep: "verify_otp"
        };
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

  // ========== LOGIN ==========
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    
    try {
      console.log("🔐 Logging in user:", { email });
      
      const response = await fetchWithNgrok(`${BASE_API}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();    
      if (!response.ok) {
        if (response.status === 403 && data.needsVerification) {
          localStorage.setItem("verificationEmail", email);
          return { 
            success: false, 
            needsVerification: true, 
            message: "Please verify your email first. OTP sent.",
            email: data.email
          };
        }
        throw new Error(data.message || 'Login failed');
      }
      
      if (data.success && data.token) {
        setAuthData(data.token, data.user);
        return { success: true, user: data.user };
      } else {
        throw new Error(data.message || 'Login failed - no token received');
      }
      
    } catch (error) {
      console.error("Login failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== VERIFY OTP ==========
  const verifyOTP = async (email, otp) => {
    setError(null);
    setLoading(true);
    
    try {
      console.log("🔑 Verifying OTP for:", { email });
      
      const response = await fetchWithNgrok(`${BASE_API}/auth/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });
      
      const data = await response.json();
      console.log("Verify OTP response:", data);
      
      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }
      
      if (data.success && data.token) {
        // Create user object for auth
        const userData = {
          id: data.userId,
          email: email,
          username: localStorage.getItem("pendingUserName") || email.split('@')[0],
          usertype: 'user',
          email_verified: true
        };
        
        setAuthData(data.token, userData);
        
        // Clear pending verification data
        localStorage.removeItem("verificationEmail");
        localStorage.removeItem("pendingUserName");
        
        return { success: true, user: userData, token: data.token };
      } else {
        throw new Error(data.message || 'OTP verification failed');
      }
      
    } catch (error) {
      console.error("OTP verification failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== RESEND OTP ==========
  const resendOTP = async (email) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetchWithNgrok(`${BASE_API}/auth/resend-otp`, {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Resend OTP failed');
      }
      
      return { success: true, message: "New verification code sent to your email" };
      
    } catch (error) {
      console.error("Resend OTP failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== COMPLETE PROFILE ==========
  const completeProfile = async (userid, profileData) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetchWithNgrok(`${BASE_API}/auth/complete-profile`, {
        method: 'PUT',
        body: JSON.stringify({ userid, ...profileData })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Profile completion failed');
      }
      
      if (data.success) {
        // Update user data with profile info
        if (user) {
          const updatedUser = {
            ...user,
            ...profileData
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
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

  // ========== GET USER PROFILE ==========
  const getUserProfile = async () => {
    const token = getToken();
    if (!token) return null;
    
    try {
      const response = await fetchWithNgrok(`${BASE_API}/auth/profile`, {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const userData = data.data || data;
        setUser(prev => ({ ...prev, ...userData }));
        return userData;
      }
      
      return null;
      
    } catch (error) {
      console.error("Get profile failed:", error);
      return null;
    }
  };

  // ========== UPDATE USER PROFILE ==========
  const updateProfile = async (profileData) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetchWithNgrok(`${BASE_API}/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }
      
      if (data.success && data.profile) {
        // Update user state
        if (user) {
          const updatedUser = { ...user, ...data.profile };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
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

  // ========== LOGOUT ==========
  const logout = useCallback(() => {
    console.log("🚪 Logging out user");
    
    // Clear all auth data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("verificationEmail");
    localStorage.removeItem("pendingUserName");
    
    // Clear session storage
    sessionStorage.clear();
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    
    return { success: true };
  }, []);

  // ========== APPLY TO BECOME DJ ==========
  const applyToBecomeDJ = async (applicationData) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetchWithNgrok(`${BASE_API}/dj/apply`, {
        method: 'POST',
        body: JSON.stringify(applicationData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
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

  // ========== GET DJ APPLICATION STATUS ==========
  const getDJApplicationStatus = async () => {
    try {
      const response = await fetchWithNgrok(`${BASE_API}/dj/application-status`, {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        return { success: true, application: data.application };
      }
      
      return { success: false, application: null };
      
    } catch (error) {
      console.error("Get DJ application status failed:", error);
      return { success: false, error: error.message };
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const getToken = useCallback(() => {
    return localStorage.getItem("token");
  }, []);

  const setAuthData = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("isAuthenticated", "true");
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const value = {
    // State
    user,
    loading,
    error,
    isAuthenticated,
    
    // Auth functions
    login,
    signup,
    logout,
    verifyOTP,
    resendOTP,
    
    // Profile functions
    completeProfile,
    getUserProfile,
    updateProfile,
    
    // DJ functions
    applyToBecomeDJ,
    getDJApplicationStatus,
    
    // Helpers
    getToken,
    setError,
    clearAuthData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};