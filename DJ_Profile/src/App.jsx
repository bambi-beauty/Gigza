// App.js - Complete DJ App with Login, OTP & Profile Setup
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { DJLogin } from "../Components/Login";
import VerifyOTP from "../Components/VerifyOTP";
import { DJProfileSetup } from "../Components/DJProfileSetup";
import { DJApplicationScreen } from "../Components/DJ_ApplicationScreen";
import { DJTopNav } from "./DJTopNav";
import { DJCalendarScreen } from "./DJCalendarScreen";
import { DJPortfolioEditor } from "./DJPortfolioEditor";
import { DJRequestsScreen } from "./DJRequestsScreen";
import { EarningsDashboardScreen } from "./EarningsDashboardScreen";
import { DJProvider } from "../API/DJContext";

// ✅ Protected Route Component
function ProtectedRoute({ children, requiredStep }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const isDJ = localStorage.getItem("userType") === "dj";
  
  // Check if this is a new DJ going through onboarding
  const isNewDJ = localStorage.getItem("isNewDJ") === "true";
  const hasCompletedProfile = localStorage.getItem("profileCompleted") === "true";
  const hasApplied = localStorage.getItem("djApplicationSubmitted") === "true";
  
  if (!isAuthenticated || !isDJ) {
    return <Navigate to="/dj-login" replace />;
  }
  
  // For existing DJs, skip onboarding checks
  if (!isNewDJ) {
    return children;
  }
  
  // For new DJs, enforce the onboarding flow
  if (requiredStep === "profile-setup" && !hasCompletedProfile) {
    return <Navigate to="/dj-profile-setup" replace />;
  }
  
  if (requiredStep === "application" && !hasApplied) {
    return <Navigate to="/dj-application" replace />;
  }
  
  return children;
}

// ✅ DJ Layout with Nav
function DJLayout({ children }) {
  return (
    <>
      <DJTopNav />
      <div className="pt-16">
        {children}
      </div>
    </>
  );
}

// ✅ Wrapper component to provide DJ context
function AppWithProviders() {
  return (
    <DJProvider>
      <App />
    </DJProvider>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isDJ: false,
    isNewDJ: false,
    profileCompleted: false,
    applicationSubmitted: false
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const isDJ = localStorage.getItem("userType") === "dj";
      const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
      const isNewDJ = localStorage.getItem("isNewDJ") === "true";
      const profileCompleted = localStorage.getItem("profileCompleted") === "true";
      const applicationSubmitted = localStorage.getItem("djApplicationSubmitted") === "true";
      
      // If no token or not a DJ, clear everything
      if (!token || !isDJ) {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userType");
        localStorage.removeItem("isNewDJ");
        localStorage.removeItem("profileCompleted");
        localStorage.removeItem("djApplicationSubmitted");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        
        setAuthState({
          isAuthenticated: false,
          isDJ: false,
          isNewDJ: false,
          profileCompleted: false,
          applicationSubmitted: false
        });
      } else {
        setAuthState({
          isAuthenticated,
          isDJ,
          isNewDJ,
          profileCompleted,
          applicationSubmitted
        });
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ✅ Public Routes - No Auth Required */}
        <Route path="/dj-login" element={<DJLogin />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        
        {/* ✅ New DJ Onboarding Flow - Only for new DJs */}
        <Route 
          path="/dj-profile-setup" 
          element={
            <ProtectedRoute requiredStep="profile-setup">
              <DJProfileSetup />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/dj-application" 
          element={
            <ProtectedRoute requiredStep="application">
              <DJApplicationScreen />
            </ProtectedRoute>
          } 
        />

        {/* ✅ Main DJ Dashboard - For both new and existing DJs */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DJLayout>
                <DJRequestsScreen />
              </DJLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <DJLayout>
                <DJRequestsScreen />
              </DJLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dj-gigs"
          element={
            <ProtectedRoute>
              <DJLayout>
                <DJCalendarScreen />
              </DJLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dj-portfolio"
          element={
            <ProtectedRoute>
              <DJLayout>
                <DJPortfolioEditor />
              </DJLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DJLayout>
                <EarningsDashboardScreen />
              </DJLayout>
            </ProtectedRoute>
          }
        />

        {/* ✅ Catch all - redirect based on auth status */}
        <Route 
          path="*" 
          element={
            authState.isAuthenticated && authState.isDJ ? 
            <Navigate to="/" replace /> : 
            <Navigate to="/dj-login" replace />
          } 
        />
      </Routes>
    </Router>
  );
}