import { useState, useEffect } from "react";
import { Check, X, Calendar, MapPin, Banknote, Clock, User, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { getUserBookings, updateBookingStatus } from "./services/bookingService";

export function DJRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getUserBookings();
      if (data.success && data.bookings) {
        setRequests(data.bookings);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Error fetching gig requests:", err);
      setError(err.message || "Failed to load gig requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Date TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Time TBD";
    return timeString.substring(0, 5);
  };

  const handleAccept = async (bookingId) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, "confirmed");
      await fetchRequests();
    } catch (err) {
      console.error("Error accepting gig:", err);
      alert(err.message || "Failed to accept gig. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDecline = async (bookingId) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, "cancelled");
      await fetchRequests();
    } catch (err) {
      console.error("Error declining gig:", err);
      alert(err.message || "Failed to decline gig. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-zinc-400">Loading gig requests...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/40 to-black px-6 pt-8 pb-6 border-b border-zinc-800 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Gig Requests</h1>
          <p className="text-zinc-400">Review and manage your incoming bookings</p>
        </div>

        <Link
          to="/dashboard"
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-xl transition font-semibold"
        >
          <Banknote className="w-4 h-4 text-green-400" />
          View Earnings
        </Link>
      </div>

      <div className="px-6 mt-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button onClick={fetchRequests} className="text-red-400 text-sm hover:text-red-300 transition">
              Retry
            </button>
          </div>
        )}

        {!loading && requests.length === 0 && !error && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center">
            <Calendar className="w-16 h-16 text-zinc-700 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No gig requests yet</h2>
            <p className="text-zinc-400">New booking requests will show up here.</p>
          </div>
        )}

        {requests.map((req) => (
          <div key={req.booking_id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden transition-all mb-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-800 p-3 rounded-full">
                    <User className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {req.client_name || req.user_name || "Client"}
                    </h3>
                    <p className="text-sm text-purple-400 font-medium">{req.event_type || "Event"}</p>
                  </div>
                </div>

                {req.booking_status === "confirmed" && (
                  <span className="bg-green-500/20 text-green-400 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Accepted
                  </span>
                )}
                {req.booking_status === "cancelled" && (
                  <span className="bg-red-500/20 text-red-400 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <X className="w-4 h-4" /> Declined
                  </span>
                )}
                {req.booking_status === "completed" && (
                  <span className="bg-blue-500/20 text-blue-400 px-4 py-1 rounded-full text-sm font-bold">
                    Completed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 bg-black/40 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                  <Calendar className="w-4 h-4 text-zinc-500" /> {formatDate(req.event_date)}
                </div>
                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                  <Clock className="w-4 h-4 text-zinc-500" /> {formatTime(req.event_time)}
                </div>
                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                  <MapPin className="w-4 h-4 text-zinc-500" /> {req.event_location || "Location TBD"}
                </div>
                <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
                  <Banknote className="w-5 h-5" /> R{req.total_price || 0} Payout
                </div>
              </div>

              {req.booking_status === "pending" && (
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => handleDecline(req.booking_id)}
                    disabled={updatingId === req.booking_id}
                    className="flex-1 bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 text-zinc-300 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X className="w-5 h-5" /> Decline
                  </button>
                  <button
                    onClick={() => handleAccept(req.booking_id)}
                    disabled={updatingId === req.booking_id}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50"
                  >
                    {updatingId === req.booking_id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" /> Accept Gig
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
