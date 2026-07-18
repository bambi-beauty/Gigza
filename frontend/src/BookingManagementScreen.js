// BookingManagementScreen.js - Connected to Backend API
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Star, Loader2, AlertCircle, CheckCircle, XCircle, Clock as ClockIcon } from "lucide-react";
import { getUserBookings, cancelBooking } from "./services/bookingService";
import { useUser } from "./UserContext/ThisUserContext";

export function BookingManagementScreen() {
  const { user, getToken } = useUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // Fetch bookings from backend
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getUserBookings();
      console.log("📡 Bookings received:", data);
      
      if (data.success && data.bookings) {
        setBookings(data.bookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

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
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Time TBD';
    return timeString.substring(0, 5);
  };

  // Handle cancel booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Cancellations may be subject to fees.')) return;
    
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      await fetchBookings(); // Refresh the list
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert(err.message || "Failed to cancel booking. Please try again.");
    } finally {
      setCancellingId(null);
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
      <div className="bg-gradient-to-b from-purple-900/30 to-black px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">My Bookings</h1>
        <p className="text-sm text-zinc-400">Manage your upcoming events</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button 
              onClick={fetchBookings}
              className="text-red-400 text-sm hover:text-red-300 transition"
            >
              Retry
            </button>
          </div>
        )}
        
        {!loading && bookings.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center">
            <Calendar className="w-16 h-16 text-zinc-700 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No upcoming bookings</h2>
            <p className="text-zinc-400 mb-6">You haven't scheduled any DJs yet.</p>
            <Link to="/" className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full font-semibold transition">
              Find a DJ
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.booking_id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {booking.dj_name?.charAt(0) || 'DJ'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{booking.dj_name || 'DJ'}</h3>
                      <p className="text-xs text-purple-400">{booking.event_type || 'Event'}</p>
                    </div>
                  </div>
                  <div className={`${getStatusColor(booking.booking_status)} text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1 border`}>
                    {getStatusIcon(booking.booking_status)}
                    {booking.booking_status?.toUpperCase() || "PENDING"}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 bg-black/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-zinc-300">{formatDate(booking.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-zinc-300">{formatTime(booking.event_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-zinc-300">{booking.duration_hours || 4} hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-zinc-300">{booking.number_of_guests || 0} guests</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
                  <span className="text-zinc-500 text-sm">Total Price:</span>
                  <span className="text-white font-bold text-lg">
                    R{booking.total_price || (booking.price_per_hour * booking.duration_hours) || 0}
                  </span>
                </div>

                <div className="flex gap-3">
                  {booking.booking_status === 'completed' && (
                    <Link 
                      to={`/review/${booking.booking_id}`}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-purple-500/25"
                    >
                      Leave Review
                    </Link>
                  )}
                  {(booking.booking_status === 'pending' || booking.booking_status === 'confirmed') && (
                    <button 
                      onClick={() => handleCancelBooking(booking.booking_id)}
                      disabled={cancellingId === booking.booking_id}
                      className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancellingId === booking.booking_id ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        'Cancel Booking'
                      )}
                    </button>
                  )}
                  <Link 
                    to={`/dj/${booking.dj_id}`}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                  >
                    View DJ Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}