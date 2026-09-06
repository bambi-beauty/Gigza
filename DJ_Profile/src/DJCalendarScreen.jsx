import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Users, FileText } from "lucide-react";

export function DJCalendarScreen() {
  const [myGigs, setMyGigs] = useState([]);

  useEffect(() => {
    
    const allBookings = JSON.parse(localStorage.getItem("gigzaBookings")) || [];
    setMyGigs(allBookings);
  }, []);

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      <div className="bg-gradient-to-b from-purple-900/40 to-black px-6 pt-4 pb-6 border-b border-zinc-800">
        <h1 className="text-3xl font-bold text-white mb-1">My Gigs</h1>
        <p className="text-zinc-400">Your upcoming scheduled performances</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-6 space-y-6">
        {myGigs.length === 0 ? (
          <div className="text-center text-zinc-500 py-12">No upcoming gigs scheduled yet.</div>
        ) : (
          myGigs.map((gig) => (
            <div key={gig.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 transition-all hover:border-zinc-700">
              
              <div className="flex justify-between items-start border-b border-zinc-800 pb-4 mb-4">
                <div>
                  <span className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-1 block">{gig.eventType}</span>
                  <h3 className="text-xl font-bold text-white">{gig.location}</h3>
                </div>
                <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-lg text-sm font-bold border border-green-500/20">
                  R{gig.totalPaid}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3 text-zinc-300 bg-black/40 p-3 rounded-xl">
                  <Calendar className="w-5 h-5 text-zinc-500" /> 
                  <span className="text-sm font-medium">{gig.date}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-300 bg-black/40 p-3 rounded-xl">
                  <Clock className="w-5 h-5 text-zinc-500" /> 
                  <span className="text-sm font-medium">{gig.time} ({gig.duration})</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-300 bg-black/40 p-3 rounded-xl">
                  <MapPin className="w-5 h-5 text-zinc-500" /> 
                  <span className="text-sm font-medium">{gig.location}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-300 bg-black/40 p-3 rounded-xl">
                  <Users className="w-5 h-5 text-zinc-500" /> 
                  <span className="text-sm font-medium">{gig.guests || "N/A"} Guests</span>
                </div>
              </div>

              {gig.notes && (
                <div className="bg-black/40 p-4 rounded-xl border border-zinc-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-bold text-zinc-300">Client Notes</span>
                  </div>
                  <p className="text-sm text-zinc-400 italic">"{gig.notes}"</p>
                </div>
              )}
              
            </div>
          ))
        )}
      </div>
    </div>
  );
}