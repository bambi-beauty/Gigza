// UserContext.js
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
  const BASE_API = 'https://gigza-testing-11.onrender.com';

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Failed to parse user data:", err);
          clearAuthData();
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

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
      const response = await fetch(`${BASE_API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      if (data.success && data.token) {
        setAuthData(data.token, data.user);
        return { 
          success: true, 
          message: "Account created successfully!",
          user: data.user
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
      const response = await fetch(`${BASE_API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();    
      
      if (!response.ok) {
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

  // ========== GOOGLE LOGIN ==========
  const googleLogin = async (email, name, googleId) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch(`${BASE_API}/api/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, googleId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Google login failed');
      }
      
      if (data.success && data.token) {
        setAuthData(data.token, data.user);
        return { success: true, user: data.user };
      } else {
        throw new Error(data.message || 'Google login failed - no token received');
      }
      
    } catch (error) {
      console.error("Google login failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== VERIFY OTP (Deprecated) ==========
  const verifyOTP = async (email, otp) => {
    return { success: true, message: "Email already verified" };
  };

  const resendOTP = async (email) => {
    return { success: true, message: "No OTP needed. Email is auto-verified." };
  };

  // ========== COMPLETE PROFILE ==========
  const completeProfile = async (userid, profileData) => {
    setError(null);
    setLoading(true);
    
    try {
      const token = getToken();
      const response = await fetch(`${BASE_API}/api/auth/complete-profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ userid, ...profileData })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Profile completion failed');
      }
      
      if (data.success) {
        if (user) {
          const updatedUser = { ...user, ...profileData };
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
      const response = await fetch(`${BASE_API}/api/auth/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
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
      const token = getToken();
      const response = await fetch(`${BASE_API}/api/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }
      
      if (data.success && data.profile) {
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
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("verificationEmail");
    localStorage.removeItem("pendingUserName");
    sessionStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    return { success: true };
  }, []);

  // ========== DJ FUNCTIONS ==========
  const applyToBecomeDJ = async (applicationData) => {
    setError(null);
    setLoading(true);
    
    try {
      const token = getToken();
      const response = await fetch(`${BASE_API}/api/dj/apply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(applicationData)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Application failed');
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
      const token = getToken();
      const response = await fetch(`${BASE_API}/api/dj/application-status`, {
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
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
    user,
    loading,
    error,
    isAuthenticated,
    login,
    signup,
    googleLogin,
    logout,
    verifyOTP,
    resendOTP,
    completeProfile,
    getUserProfile,
    updateProfile,
    applyToBecomeDJ,
    getDJApplicationStatus,
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