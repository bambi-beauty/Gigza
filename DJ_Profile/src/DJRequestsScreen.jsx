import { useState } from "react";
import { Calendar, MapPin, Clock, Banknote, CheckCircle2, XCircle } from "lucide-react";

export function DJRequestsScreen() {
  const [requests, setRequests] = useState([
    {
      id: "REQ-9921",
      client: "Sarah Ndlovu",
      eventType: "Wedding Reception",
      date: "2026-10-24",
      time: "17:00",
      duration: "5 Hours",
      location: "Katy's Palace Bar, Kramerville",
      pay: 4000,
      notes: "Need a mix of House and 90s RnB. No techno please."
    },
    {
      id: "REQ-9922",
      client: "TechCorp SA",
      eventType: "Corporate Event",
      date: "2026-11-05",
      time: "19:00",
      duration: "3 Hours",
      location: "Sandton Convention Centre",
      pay: 2400,
      notes: "Standard background lounge music during networking."
    }
  ]);

  const handleAction = (id, action) => {
    // In a real app, this would send an update to the database
    setRequests(requests.filter(req => req.id !== id));
  };

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      <div className="px-6 pt-4 pb-6 border-b border-zinc-800">
        <h1 className="text-3xl font-bold text-white mb-1">Incoming Requests</h1>
        <p className="text-zinc-400">You have {requests.length} pending bookings</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-6 space-y-6">
        {requests.length === 0 ? (
          <div className="text-center text-zinc-500 py-12">No new requests right now.</div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-500/10 text-purple-400 px-4 py-2 rounded-bl-2xl text-sm font-bold border-b border-l border-purple-500/20">
                R{req.pay}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">{req.eventType}</h3>
              <p className="text-zinc-400 text-sm mb-6">Requested by <span className="text-white font-medium">{req.client}</span></p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Calendar className="w-5 h-5 text-purple-400" /> 
                  <span className="text-sm">{req.date}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-300">
                  <Clock className="w-5 h-5 text-purple-400" /> 
                  <span className="text-sm">{req.time} ({req.duration})</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-300 col-span-2">
                  <MapPin className="w-5 h-5 text-purple-400" /> 
                  <span className="text-sm">{req.location}</span>
                </div>
              </div>

              <div className="bg-black/50 p-4 rounded-xl border border-zinc-800/50 mb-6">
                <p className="text-sm text-zinc-400 italic">"{req.notes}"</p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => handleAction(req.id, 'decline')}
                  className="flex-1 bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" /> Decline
                </button>
                <button 
                  onClick={() => handleAction(req.id, 'accept')}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Accept Gig
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}