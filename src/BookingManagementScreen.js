import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Search } from "lucide-react";

export function BookingManagementScreen() {
  // We use an empty array as our initial state
  const [bookings, setBookings] = useState([]);

  // useEffect runs exactly once when this screen loads. It reaches into the browser memory!
  useEffect(() => {
    const savedBookings = JSON.parse(localStorage.getItem("gigzaBookings")) || [];
    setBookings(savedBookings);
  }, []);

  return (
    <div className="min-h-screen bg-black pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/30 to-black px-6 pt-6 pb-6">
        <h1 className="text-2xl font-bold text-white">My Bookings</h1>
        <p className="text-sm text-zinc-400">Manage your upcoming events</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-4">
        {/* If they have NO bookings saved, show this empty state */}
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
          /* If they DO have bookings, map over them and display cards! */
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
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
                  <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full font-semibold">
                    {booking.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-black/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">4 Hours</span>
                  </div>
                </div>

                {/* Provide a button to leave a review, passing the specific Booking ID */}
                <div className="flex gap-2">
                  <Link 
                    to={`/review/${booking.id}`}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-center py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Leave Review
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