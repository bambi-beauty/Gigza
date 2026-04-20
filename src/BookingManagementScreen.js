import { useState } from "react";
import { Calendar, MapPin, Clock, DollarSign, Star, MoreVertical } from "lucide-react";
import { Link } from "react-router";

const mockBookings = {
  upcoming: [
    {
      id: 1,
      djName: "DJ Pulse",
      djImage: "https://images.unsplash.com/photo-1764510383709-14be6ec28548?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      eventType: "Wedding",
      date: "April 15, 2026",
      time: "7:00 PM",
      location: "Grand Hotel, NYC",
      amount: 1200,
      status: "confirmed",
    },
    {
      id: 2,
      djName: "Luna Beats",
      djImage: "https://images.unsplash.com/photo-1763630051863-fd7e36573b16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      eventType: "Birthday Party",
      date: "April 22, 2026",
      time: "8:00 PM",
      location: "Private Venue",
      amount: 800,
      status: "pending",
    },
  ],
  past: [
    {
      id: 3,
      djName: "Max Voltage",
      djImage: "https://images.unsplash.com/photo-1549045469-68d0f4ce85c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      eventType: "Corporate Event",
      date: "March 28, 2026",
      time: "6:00 PM",
      location: "Tech Hub, NYC",
      amount: 1500,
      status: "completed",
      canReview: true,
    },
    {
      id: 4,
      djName: "Echo Storm",
      djImage: "https://images.unsplash.com/photo-1712530708772-49749a0bad58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      eventType: "Club Night",
      date: "March 15, 2026",
      time: "10:00 PM",
      location: "Pulse Club",
      amount: 880,
      status: "completed",
      canReview: false,
    },
  ],
  cancelled: [
    {
      id: 5,
      djName: "Neon Flow",
      djImage: "https://images.unsplash.com/photo-1723209943809-55527e4f6b24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      eventType: "Private Party",
      date: "March 10, 2026",
      time: "9:00 PM",
      location: "Downtown Loft",
      amount: 600,
      status: "cancelled",
    },
  ],
};

export function BookingManagementScreen() {
  const [activeTab, setActiveTab] = useState("upcoming");

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "completed":
        return "bg-blue-500/20 text-blue-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-zinc-800 text-zinc-400";
    }
  };

  const currentBookings = mockBookings[activeTab];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">My Bookings</h1>
          <p className="text-lg text-zinc-400">Manage your DJ bookings</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="bg-zinc-900 rounded-2xl p-1.5 flex gap-1 max-w-md">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-colors ${
                activeTab === "upcoming"
                  ? "bg-purple-500 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-colors ${
                activeTab === "past"
                  ? "bg-purple-500 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Past
            </button>
            <button
              onClick={() => setActiveTab("cancelled")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-colors ${
                activeTab === "cancelled"
                  ? "bg-purple-500 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentBookings.length === 0 ? (
            <div className="col-span-2 text-center py-20">
              <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-lg">No bookings found</p>
            </div>
          ) : (
            currentBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-purple-500 transition-colors"
              >
                <div className="p-6">
                  {/* DJ Info */}
                  <div className="flex items-start gap-4 mb-6">
                    <img
                      src={booking.djImage}
                      alt={booking.djName}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          {booking.djName}
                        </h3>
                        <button className="text-zinc-400 hover:text-white transition-colors">
                          <MoreVertical className="w-6 h-6" />
                        </button>
                      </div>
                      <p className="text-purple-400 mb-3">
                        {booking.eventType}
                      </p>
                      <div
                        className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium capitalize ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Clock className="w-5 h-5 text-purple-400" />
                      <span>{booking.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <MapPin className="w-5 h-5 text-purple-400" />
                      <span>{booking.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <DollarSign className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-white">${booking.amount}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {booking.status === "confirmed" && (
                      <>
                        <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors">
                          View Details
                        </button>
                        <button className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-xl font-medium transition-colors">
                          Cancel
                        </button>
                      </>
                    )}
                    {booking.status === "pending" && (
                      <Link
                        to={`/payment/${booking.id}`}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 rounded-xl font-medium text-center transition-all"
                      >
                        Complete Payment
                      </Link>
                    )}
                    {booking.status === "completed" && (
                      <>
                        <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors">
                          View Receipt
                        </button>
                        {booking.canReview && (
                          <Link
                            to={`/review/${booking.id}`}
                            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                          >
                            <Star className="w-5 h-5" />
                            Review
                          </Link>
                        )}
                      </>
                    )}
                    {booking.status === "cancelled" && (
                      <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors">
                        Book Again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}