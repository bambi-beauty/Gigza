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
import { BookingFormScreen } from "./BookingFormScreen"; // ✅ Add this
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
import { DJApplicationScreen } from "./DJApplicationScreen";

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AuthenticatedLayout({ children }) {
  return (
    <>
      <TopNav />
      {children}
    </>
  );
}

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
  }, []);

  const goToProfileSetup = () => {
    localStorage.setItem("needsProfileSetup", "true");
    navigate("/profile-setup");
  };

  const goToHome = (user) => {
    localStorage.removeItem("needsProfileSetup");
    if (localStorage.getItem("signupIntent") === "dj") {
      localStorage.removeItem("signupIntent");
      navigate("/apply-dj");
      return;
    }
    navigate(user?.usertype === "dj" ? "/requests" : "/");
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
      
      {/* Home */}
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
      
      {/* Bookings */}
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
      
      {/* Booking Form - Create new booking */}
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
      
      {/* DJ Profile */}
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
      
      {/* DJ Dashboard (for approved DJs) */}
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
      
      {/* Emergency SOS */}
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
      
      {/* Notifications */}
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
      
      {/* Checkout / Payment */}
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
      
      {/* Leave Review */}
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
      
      {/* Scheduled Booking (alternative booking flow) */}
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
      
      {/* User Profile */}
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
      
      {/* DJ Requests (for DJs to see booking requests) */}
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
      
      {/* Apply to Become a DJ */}
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