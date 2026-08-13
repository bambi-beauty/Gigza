import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { UserProvider } from "./UserContext/ThisUserContext";
import { SocketProvider } from "./UserContext/SocketContext";
import Splash from "./components/Splash";
import Login from "./components/Login";
import { ProfileSetupScreen } from "./ProfileSetupScreen";
import { TopNav } from "./TopNav";
import { HomeScreen } from "./HomeScreen";
import { BookingManagementScreen } from "./BookingManagementScreen";
import { BookingFormScreen } from "./BookingFormScreen";
import { DJProfileScreen } from "./DJProfileScreen";
import { EarningsDashboardScreen } from "./EarningsDashboardScreen";
// ✅ FIXED: Changed from named import to default import
import EmergencyDJScreen from './EmergencyDJScreen';
import { NotificationsScreen } from "./NotificationsScreen";
import { PaymentScreen } from "./PaymentScreen";
import { RatingsReviewsScreen } from "./RatingsReviewsScreen";
import { ScheduledBookingScreen } from "./ScheduledBookingScreen";
import { UserProfileScreen } from "./UserProfileScreen";
import { DJRequestsScreen } from "./DJRequestsScreen";
import { ReviewScreen } from "./ReviewScreen";
import { DJApplicationScreen } from "./DJApplicationScreen";

// ✅ FIX: Move these components OUTSIDE AppContent
// ProtectedRoute component - checks authentication
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// AuthenticatedLayout component - wraps authenticated pages with TopNav
function AuthenticatedLayout({ children }) {
  return (
    <>
      <TopNav />
      {children}
    </>
  );
}

// AppContent component
function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Check on mount if user needs profile setup
  useEffect(() => {
    const needsProfileSetup = localStorage.getItem("needsProfileSetup") === "true";
    if (needsProfileSetup && !window.location.pathname.includes("/profile-setup")) {
      navigate("/profile-setup");
    }
  }, [navigate]);

  const goToProfileSetup = () => {
    localStorage.setItem("needsProfileSetup", "true");
    navigate("/profile-setup");
  };

  const goToHome = () => {
    localStorage.removeItem("needsProfileSetup");
    navigate("/");
  };

  if (isLoading) {
    return <Splash />;
  }

  return (
    <Routes>
      {/* ========== PUBLIC ROUTES (No Auth) ========== */}
      <Route 
        path="/login" 
        element={<Login goToProfileSetup={goToProfileSetup} goToHome={goToHome} />} 
      />
      <Route 
        path="/profile-setup" 
        element={<ProfileSetupScreen onComplete={goToHome} onSkip={goToHome} />} 
      />

      {/* ========== PROTECTED ROUTES (Auth Required) ========== */}
      
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
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App component
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