// BookingManagementScreen.js
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Star, Loader2, AlertCircle, CheckCircle, XCircle, Clock as ClockIcon, Bell } from "lucide-react";
import { getUserBookings, cancelBooking } from "./services/bookingService";
import { useUser } from "./UserContext/ThisUserContext";
import { useSocket } from "./UserContext/SocketContext";

export function BookingManagementScreen() {
  const { user, getToken } = useUser();
  const { socket, isConnected, notifications, unreadCount, markAllAsRead, setNotifications, setUnreadCount } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch bookings from backend
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    
    const token = getToken();
    
    try {
      console.log("🔑 Token check:", {
        hasToken: !!token,
        user: user ? { id: user.userid || user.id, role: user.role } : 'no user'
      });
      
      if (!token) {
        setError("Please log in to view your bookings");
        setBookings([]);
        setLoading(false);
        return;
      }

      console.log("📡 Fetching bookings from API...");
      const data = await getUserBookings();
      console.log("📡 Bookings received:", data);
      
      // Handle response
      if (data.success && data.bookings) {
        setBookings(data.bookings);
      } else if (data.bookings) {
        setBookings(data.bookings);
      } else if (Array.isArray(data)) {
        setBookings(data);
      } else {
        setBookings([]);
        if (data.message) {
          setError(data.message);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching bookings:", err);
      
      let errorMessage = err.message || "Failed to load bookings. Please try again.";
      
      if (err.message?.includes("401") || err.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (err.message?.includes("403") || err.status === 403) {
        errorMessage = "You don't have permission to view bookings.";
      } else if (err.message?.includes("404") || err.status === 404) {
        errorMessage = "Bookings service not found. Please try again later.";
      } else if (err.message?.includes("NetworkError") || err.message?.includes("fetch")) {
        errorMessage = "Cannot connect to server. Please check your internet connection.";
      }
      
      setError(errorMessage);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Listen for real-time booking notifications
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('🔌 Socket not connected for booking management');
      return;
    }

    console.log('👂 Setting up booking management notification listeners...');

    // Handle booking confirmed
    const handleBookingConfirmed = (data) => {
      console.log('📬 Booking confirmed in management:', data);
      fetchBookings(); // Refresh bookings to show updated status
    };

    // Handle booking cancelled
    const handleBookingCancelled = (data) => {
      console.log('📬 Booking cancelled in management:', data);
      fetchBookings();
    };

    // Handle booking completed
    const handleBookingCompleted = (data) => {
      console.log('📬 Booking completed in management:', data);
      fetchBookings();
    };

    // Handle new booking
    const handleBookingCreated = (data) => {
      console.log('📬 New booking created in management:', data);
      fetchBookings();
    };

    socket.on('booking:confirmed', handleBookingConfirmed);
    socket.on('booking:cancelled', handleBookingCancelled);
    socket.on('booking:completed', handleBookingCompleted);
    socket.on('booking:created', handleBookingCreated);

    return () => {
      socket.off('booking:confirmed', handleBookingConfirmed);
      socket.off('booking:cancelled', handleBookingCancelled);
      socket.off('booking:completed', handleBookingCompleted);
      socket.off('booking:created', handleBookingCreated);
    };
  }, [socket, isConnected]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return <CheckCircle className="w-3 h-3" />;
      case 'pending': return <ClockIcon className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Time TBD';
    try {
      if (timeString.includes(':')) {
        return timeString.substring(0, 5);
      }
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Time';
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Cancellations may be subject to fees.')) return;
    
    setCancellingId(bookingId);
    try {
      console.log(`📡 Cancelling booking ${bookingId}...`);
      await cancelBooking(bookingId);
      console.log(`✅ Booking ${bookingId} cancelled successfully`);
      await fetchBookings();
    } catch (err) {
      console.error("❌ Error cancelling booking:", err);
      
      let errorMessage = "Failed to cancel booking. Please try again.";
      if (err.message?.includes("401") || err.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (err.message?.includes("403") || err.status === 403) {
        errorMessage = "You don't have permission to cancel this booking.";
      } else if (err.message?.includes("404") || err.status === 404) {
        errorMessage = "Booking not found. It may have already been cancelled.";
      }
      alert(errorMessage);
    } finally {
      setCancellingId(null);
    }
  };

  const handleRetry = () => {
    if (!loading) {
      fetchBookings();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-zinc-400">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-8">
      <div className="bg-gradient-to-b from-purple-900/30 to-black px-6 pt-12 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Bookings</h1>
          <p className="text-sm text-zinc-400">Manage your upcoming events</p>
          {isConnected ? (
            <span className="text-xs text-green-400 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              Live updates active
            </span>
          ) : (
            <span className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
              Connecting to live updates...
            </span>
          )}
        </div>
        
        {/* ✅ Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-white/10 rounded-full transition"
          >
            <Bell className="w-6 h-6 text-zinc-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 rounded-t-xl">
                <span className="text-white font-medium">Notifications</span>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-purple-400 text-xs hover:text-purple-300 transition"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-zinc-500 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notif, index) => (
                  <div key={notif.id || index} className={`p-3 border-b border-zinc-800 hover:bg-white/5 transition ${!notif.read ? 'bg-purple-500/5' : ''}`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{notif.title}</p>
                        <p className="text-zinc-400 text-xs">{notif.message}</p>
                        <p className="text-zinc-500 text-xs mt-1">
                          {notif.timestamp ? new Date(notif.timestamp).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1"></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm flex-1">{error}</p>
              <button 
                onClick={handleRetry}
                disabled={loading}
                className="text-red-400 text-sm hover:text-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        )}
        
        {!loading && bookings.length === 0 && !error ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center">
            <Calendar className="w-16 h-16 text-zinc-700 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No upcoming bookings</h2>
            <p className="text-zinc-400 mb-6">You haven't scheduled any DJs yet.</p>
            <Link to="/" className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full font-semibold transition">
              Find a DJ
            </Link>
          </div>
        ) : (
          !error && bookings.length > 0 && (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const bookingId = booking.booking_id || booking.id;
                const djId = booking.dj_id || booking.djId;
                const djName = booking.dj_name || booking.dj?.name || 'DJ';
                const status = booking.booking_status || booking.status || 'pending';
                
                return (
                  <div key={bookingId} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg flex-shrink-0">
                          <span className="text-white font-bold text-lg">
                            {djName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{djName}</h3>
                          <p className="text-xs text-purple-400">
                            {booking.event_type || booking.eventType || 'Event'}
                          </p>
                        </div>
                      </div>
                      <div className={`${getStatusColor(status)} text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1 border flex-shrink-0 ml-2`}>
                        {getStatusIcon(status)}
                        {status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 bg-black/50 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-sm text-zinc-300">
                          {formatDate(booking.event_date || booking.eventDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-sm text-zinc-300">
                          {formatTime(booking.event_time || booking.eventTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-sm text-zinc-300">
                          {booking.duration_hours || booking.durationHours || 4} hours
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-sm text-zinc-300">
                          {booking.number_of_guests || booking.numberOfGuests || 0} guests
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
                      <span className="text-zinc-500 text-sm">Total Price:</span>
                      <span className="text-white font-bold text-lg">
                        R{booking.total_price || booking.totalPrice || 
                          (booking.price_per_hour || booking.pricePerHour || 0) * 
                          (booking.duration_hours || booking.durationHours || 0) || 0}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      {(status === 'completed') && (
                        <Link 
                          to={`/review/${bookingId}`}
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-purple-500/25"
                        >
                          Leave Review
                        </Link>
                      )}
                      {(status === 'pending' || status === 'confirmed') && (
                        <button 
                          onClick={() => handleCancelBooking(bookingId)}
                          disabled={cancellingId === bookingId}
                          className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingId === bookingId ? (
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          ) : (
                            'Cancel Booking'
                          )}
                        </button>
                      )}
                      <Link 
                        to={`/dj/${djId}`}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                      >
                        View DJ Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}