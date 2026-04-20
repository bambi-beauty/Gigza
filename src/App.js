import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TopNav } from "./TopNav"; // Importing our new TopNav!
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

function App() {
  return (
    <BrowserRouter>
      {/* The TopNav goes at the very top, inside BrowserRouter but outside the Routes */}
      <TopNav />
      
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/bookings" element={<BookingManagementScreen />} />
        <Route path="/dj/:id" element={<DJProfileScreen />} />
        <Route path="/dashboard" element={<EarningsDashboardScreen />} />
        <Route path="/emergency" element={<EmergencyDJScreen />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="/payment/:bookingId" element={<PaymentScreen />} />
        <Route path="/review/:bookingId" element={<RatingsReviewsScreen />} />
        <Route path="/book/:id" element={<ScheduledBookingScreen />} />
        <Route path="/profile" element={<UserProfileScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;