import React, { useState, createContext, useContext, useEffect } from "react";

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
  // Base API URL - no trailing slash
  const BASE_API = 'http://localhost:5000/api';

  // Helper function to make fetch requests with ngrok header
  const fetchWithNgrok = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '69420', // Bypass ngrok warning
      ...options.headers,
    };

    try {
      console.log(`Making ${options.method || 'GET'} request to:`, url);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(`Response status: ${response.status} for ${url}`);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JSON response received:", textResponse.substring(0, 500));
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Endpoint: ${url}`);
      }

      return response;
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      
      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (err) {
          console.error("Failed to parse user data:", err);
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  // Helper to set auth data
  const setAuthData = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("isAuthenticated", "true");
    setUser(userData);
  };

  // Clear auth data
  const clearAuthData = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    setUser(null);
  };

  // ========== SIGNUP ==========
  const signup = async (name, email, password) => {
    setError(null);
    setLoading(true);
    
    try {
      console.log("Signing up user:", { name, email });
      
      const response = await fetchWithNgrok(`${BASE_API}/auth/signup`, {
        method: 'POST',
        body: JSON.stringify({ username: name, email, password })
      });
      
      const data = await response.json();
      console.log("Signup response:", data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      if (data.success) {
        // Store email temporarily for OTP verification
        localStorage.setItem("verificationEmail", email);
        localStorage.setItem("pendingUserName", name);
        
        return { 
          success: true, 
          message: "Verification code sent to your email",
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
      console.log("Logging in user:", { email });
      
      const response = await fetchWithNgrok(`${BASE_API}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      console.log("Login response:", data);
      
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

  // ========== VERIFY OTP ==========
  const verifyOTP = async (email, otp) => {
    setError(null);
    setLoading(true);
    
    try {
      console.log("Verifying OTP for:", { email, otp });
      
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
        setAuthData(data.token, data.user);
        // Clear pending verification data
        localStorage.removeItem("verificationEmail");
        localStorage.removeItem("pendingUserName");
        return { success: true, user: data.user };
      } else {
        throw new Error(data.message || 'OTP verification failed - no token received');
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
      
      return { success: true, message: "New verification code sent" };
      
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
      console.log("Google login for:", { email, name });
      
      const response = await fetchWithNgrok(`${BASE_API}/auth/google-login`, {
        method: 'POST',
        body: JSON.stringify({ email, name, googleId })
      });
      
      const data = await response.json();
      console.log("Google login response:", data);
      
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

// In your ThisUserContext.js, ensure logout is implemented correctly:
const logout = () => {
  // Clear all auth data from localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("verificationEmail");
  localStorage.removeItem("pendingUserName");
  

  sessionStorage.clear();

  setUser(null);
  
  return { success: true };
};
  // ========== HELPER FUNCTIONS ==========
  const getToken = () => {
    return localStorage.getItem("token");
  };

  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    return !!token && !!user;
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      loading,
      error,
      login, 
      signup, 
      verifyOTP,
      resendOTP,
      googleLogin,
      logout,
      getToken,
      isAuthenticated,
      setError
    }}>
      {children}
    </UserContext.Provider>
  );
};