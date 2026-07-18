import { useState } from "react";
import { Check, X, Calendar, MapPin, Banknote, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";


export function DJRequestsScreen() {
  // We set up some fake incoming requests for the prototype
  const [requests, setRequests] = useState([
    {
      id: "REQ-001",
      clientName: "Marcus Thorne",
      eventType: "Wedding Reception",
      date: "Saturday, Oct 24",
      time: "6:00 PM - 10:00 PM",
      location: "Downtown Grand Hotel",
      distance: "4.2 miles",
      payout: 800,
      status: "pending"
    },
    {
      id: "REQ-002",
      clientName: "Sarah Jenkins",
      eventType: "Corporate Holiday Party",
      date: "Friday, Dec 12",
      time: "8:00 PM - 1:00 AM",
      location: "Tech Hub Atrium",
      distance: "12 miles",
      payout: 1200,
      status: "pending"
    }
  ]);

  // Functions to handle accepting and declining
  const handleAccept = (id) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: "accepted" } : req
    ));
    // In a real app, this would also push the booking to the Client's dashboard!
  };

  const handleDecline = (id) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: "declined" } : req
    ));
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/40 to-black px-6 pt-8 pb-6 border-b border-zinc-800 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Gig Requests</h1>
          <p className="text-zinc-400">Review and manage your incoming bookings</p>
        </div>
        
        {/* New Earnings Button for DJs */}
        <Link 
          to="/dashboard"
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-xl transition font-semibold"
        >
          <Banknote className="w-4 h-4 text-green-400" />
          View Earnings
        </Link>
      </div>
        {requests.map((req) => (
          <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden transition-all">
            {/* The Request Card Content */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-800 p-3 rounded-full">
                    <User className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{req.clientName}</h3>
                    <p className="text-sm text-purple-400 font-medium">{req.eventType}</p>
                  </div>
                </div>
                
                {/* Status Badges */}
                {req.status === "accepted" && (
                  <span className="bg-green-500/20 text-green-400 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Accepted
                  </span>
                )}
                {req.status === "declined" && (
                  <span className="bg-red-500/20 text-red-400 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <X className="w-4 h-4" /> Declined
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 bg-black/40 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                  <Calendar className="w-4 h-4 text-zinc-500" /> {req.date}
                </div>
                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                  <Clock className="w-4 h-4 text-zinc-500" /> {req.time}
                </div>
                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                  <MapPin className="w-4 h-4 text-zinc-500" /> {req.location}
                </div>
                <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
                  <Banknote className="w-5 h-5" /> R{req.payout} Payout
                </div>
              </div>

              {/* Action Buttons (Only show if pending) */}
              {req.status === "pending" && (
                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={() => handleDecline(req.id)}
                    className="flex-1 bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 text-zinc-300 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" /> Decline
                  </button>
                  <button 
                    onClick={() => handleAccept(req.id)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                  >
                    <Check className="w-5 h-5" /> Accept Gig
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    
  );
}