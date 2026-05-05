import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { UserProvider } from "./UserContext/ThisUserContext";
import { SocketProvider } from "./UserContext/SocketContext"; // Add this import
import Splash from "./components/Splash";
import Login from "./components/Login";
import Verification from "./components/Verification";
import { TopNav } from "./TopNav";
import { HomeScreen } from "./HomeScreen";
import { BookingManagementScreen } from "./BookingManagementScreen";
import { DJProfileScreen } from "./DJProfileScreen";
import { EarningsDashboardScreen } from "./EarningsDashboardScreen";
import { EmergencyDJScreen } from "./EmergencyDJScreen";
import { NotificationsScreen } from "./NotificationsScreen";
import { PaymentScreen } from "./PaymentScreen";
import { RatingsReviewsScreen } from "./RatingsReviewsScreen";
import { ScheduledBookingScreen } from "./ScheduledBookingScreen";
import { UserProfileScreen } from "./UserProfileScreen";
import { DJRequestsScreen } from "./DJRequestsScreen";
import { ReviewScreen } from "./ReviewScreen";

// Protected Route wrapper component
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Layout wrapper for authenticated routes (includes TopNav)
function AuthenticatedLayout({ children }) {
  return (
    <>
      <TopNav />
      {children}
    </>
  );
}

// Component that handles navigation and routing
function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Only show splash screen briefly, then check auth
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Short splash screen or remove entirely

    return () => clearTimeout(timer);
  }, []);

  // Navigation functions using React Router
  const goToVerification = () => {
    navigate("/verify");
  };

  const goToSuccess = () => {
    navigate("/");
  };

  // Show splash screen only briefly
  if (isLoading) {
    return <Splash />;
  }

  return (
    <Routes>
      {/* Public Auth Routes - No TopNav */}
      <Route path="/login" element={<Login goToVerification={goToVerification} goToSuccess={goToSuccess} />} />
      <Route path="/verify" element={<Verification goToSuccess={goToSuccess} />} />

      {/* Protected Routes with TopNav */}
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
        path="/book/:id"
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
      
      {/* Catch all route - redirect to login if not authenticated, else home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App component wrapped with UserProvider, SocketProvider, and BrowserRouter
function App() {
  return (
    <UserProvider>
      <SocketProvider> {/* Add SocketProvider here */}
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SocketProvider>
    </UserProvider>
  );
}

export default App;