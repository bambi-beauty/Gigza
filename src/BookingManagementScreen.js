// BookingManagementScreen.js - Direct API calls
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Star } from "lucide-react";

export function BookingManagementScreen() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    // Load bookings from localStorage
    const savedBookings = JSON.parse(localStorage.getItem("gigzaBookings")) || [];
    setBookings(savedBookings);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle cancel booking
  const handleCancelBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      const updatedBookings = bookings.filter(booking => booking.id !== bookingId);
      setBookings(updatedBookings);
      localStorage.setItem("gigzaBookings", JSON.stringify(updatedBookings));
    }
  };

  return (
    <div className="min-h-screen bg-black pb-8">
      <div className="bg-gradient-to-b from-purple-900/30 to-black px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">My Bookings</h1>
        <p className="text-sm text-zinc-400">Manage your upcoming events</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-4">
        {bookings.length === 0 ? (
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
              <div key={booking.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={booking.djImage} 
                      alt={booking.djName} 
                      className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                    />
                    <div>
                      <h3 className="font-bold text-white">{booking.djName}</h3>
                      <p className="text-xs text-purple-400">{booking.eventType}</p>
                    </div>
                  </div>
                  <span className={`${getStatusColor(booking.status)} text-xs px-3 py-1 rounded-full font-semibold`}>
                    {booking.status?.toUpperCase() || "PENDING"}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-black/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">{formatDate(booking.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">{booking.duration || "4 Hours"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">{booking.guests || 0} guests</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {booking.status === 'completed' && (
                    <Link 
                      to={`/review/${booking.id}`}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-center py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Leave Review
                    </Link>
                  )}
                  {booking.status === 'pending' && (
                    <button 
                      onClick={() => handleCancelBooking(booking.id)}
                      className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Cancel Booking
                    </button>
                  )}
                  <Link 
                    to={`/dj/${booking.djId}`}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-center py-2 rounded-lg text-sm font-semibold transition"
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