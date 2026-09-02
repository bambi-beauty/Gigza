// App.js - UPDATED with profile endpoint

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { UserProvider } from "./UserContext/ThisUserContext";
import { SocketProvider } from "./UserContext/SocketContext";
import Splash from "./components/Splash";
import Login from "./components/Login";

// Default exports
import EmergencyDJScreen from "./EmergencyDJScreen";
// Named exports
import { ProfileSetupScreen } from "./ProfileSetupScreen";
import { TopNav } from "./TopNav";
import { HomeScreen } from "./HomeScreen";
import { BookingManagementScreen } from "./BookingManagementScreen";
import { BookingFormScreen } from "./BookingFormScreen";
import { DJProfileScreen } from "./DJProfileScreen";
import { EarningsDashboardScreen } from "./EarningsDashboardScreen";
import { NotificationsScreen } from "./NotificationsScreen";
import { PaymentScreen } from "./PaymentScreen";
import { RatingsReviewsScreen } from "./RatingsReviewsScreen";
import { ScheduledBookingScreen } from "./ScheduledBookingScreen";
import { UserProfileScreen } from "./UserProfileScreen";
import { DJRequestsScreen } from "./DJRequestsScreen";
import { ReviewScreen } from "./ReviewScreen";
import { DJApplicationScreen } from "./DJApplicationScreen";

const API_BASE = 'https://gigza-testing-11.onrender.com/api';

// ============================================
// ProtectedRoute Component - FIXED
// ============================================
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ✅ Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('❌ No token found');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        console.log('🔍 Checking auth with profile endpoint...');
        
        // ✅ Use profile endpoint instead of validate
        const response = await fetch(`${API_BASE}/auth/profile`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          console.log('✅ Authenticated successfully');
          setIsAuthenticated(true);
        } else {
          console.log('❌ Not authenticated, status:', response.status);
          setIsAuthenticated(false);
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
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
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// ============================================
// AuthenticatedLayout Component
// ============================================
function AuthenticatedLayout({ children }) {
  if (!TopNav) {
    console.error('❌ TopNav component is undefined - check import');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div>
          <h1 className="text-red-500">Error: TopNav component not found</h1>
          <p className="text-sm mt-2">Please check the import in App.js</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TopNav />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}

// ============================================
// AppContent Component
// ============================================
function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Splash />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <Login 
            goToProfileSetup={() => navigate("/profile-setup")} 
            goToHome={() => navigate("/")} 
          />
        } 
      />
      
      <Route 
        path="/profile-setup" 
        element={
          <ProfileSetupScreen 
            onComplete={() => navigate("/")} 
            onSkip={() => navigate("/")} 
          />
        } 
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <HomeScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <BookingManagementScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/book/:djId"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <BookingFormScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dj/:id"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <DJProfileScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <EarningsDashboardScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/emergency"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <EmergencyDJScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <NotificationsScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/checkout/:djId"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <PaymentScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/review/:bookingId"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <RatingsReviewsScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/schedule/:id"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <ScheduledBookingScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <UserProfileScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <DJRequestsScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/apply-dj"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <DJApplicationScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/review/:bookingId"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <ReviewScreen />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ============================================
// Main App Component
// ============================================
function App() {
  return (
    <UserProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SocketProvider>
    </UserProvider>
  );
}

export default App;