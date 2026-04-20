import { useState } from "react";
import { MapPin, Clock, DollarSign, Zap, Search } from "lucide-react";

const nearbyDJs = [
  {
    id: 1,
    name: "DJ Pulse",
    distance: "0.5 mi",
    available: true,
    lat: 40.7589,
    lng: -73.9851,
  },
  {
    id: 2,
    name: "Luna Beats",
    distance: "1.2 mi",
    available: true,
    lat: 40.7614,
    lng: -73.9776,
  },
  {
    id: 3,
    name: "Echo Storm",
    distance: "2.1 mi",
    available: false,
    lat: 40.7489,
    lng: -73.9680,
  },
];

export function EmergencyDJScreen() {
  const [location, setLocation] = useState("Times Square, NYC");
  const [time, setTime] = useState("Now");
  const [budget, setBudget] = useState("300");
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestDJ = () => {
    setIsRequesting(true);
    setTimeout(() => {
      setIsRequesting(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="bg-gradient-to-b from-red-900/30 to-transparent rounded-3xl p-6 lg:p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-red-500 rounded-full p-3 lg:p-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">Emergency DJ Mode</h1>
              <p className="text-lg text-zinc-400 mt-1">Find a DJ instantly when you need one most</p>
            </div>
          </div>

          {isRequesting && (
            <div className="mt-6 bg-red-500/20 border border-red-500 rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-ping" />
                <span className="text-red-400 font-medium">
                  Searching for available DJs nearby...
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Map */}
          <div>
            <div className="relative h-96 lg:h-[600px] bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                {/* Simplified map representation */}
                <div className="relative w-full h-full">
                  {nearbyDJs.map((dj, index) => (
                    <div
                      key={dj.id}
                      className="absolute animate-pulse"
                      style={{
                        left: `${30 + index * 20}%`,
                        top: `${40 + index * 10}%`,
                      }}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          dj.available
                            ? "bg-purple-500 shadow-lg shadow-purple-500/50"
                            : "bg-zinc-600"
                        }`}
                      >
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <p className="text-white text-xs font-medium">{dj.name}</p>
                        <p className="text-zinc-400 text-xs">{dj.distance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="absolute top-6 right-6 bg-zinc-900 border border-zinc-700 rounded-full p-3 hover:bg-zinc-800 transition-colors">
                <Search className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Nearby DJs List */}
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Available Nearby
              </h2>
              <div className="space-y-4">
                {nearbyDJs.map((dj) => (
                  <div
                    key={dj.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between hover:border-purple-500 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-white text-lg">{dj.name}</h3>
                      <p className="text-zinc-400 mt-1">{dj.distance} away</p>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        dj.available
                          ? "bg-green-500/20 text-green-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {dj.available ? "Available" : "Busy"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Request Form */}
          <div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 lg:p-8 sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-6">Request Details</h2>
              
              <div className="space-y-6">
                {/* Location */}
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-3 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl pl-14 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-3 block">
                    When do you need them?
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400" />
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl pl-14 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                    >
                      <option>Now</option>
                      <option>In 30 minutes</option>
                      <option>In 1 hour</option>
                      <option>In 2 hours</option>
                    </select>
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-3 block">
                    Budget per hour
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400" />
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl pl-14 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Request Button */}
                <button
                  onClick={handleRequestDJ}
                  disabled={isRequesting}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-5 rounded-xl shadow-lg shadow-red-500/30 transition-all"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Zap className="w-6 h-6" />
                    <span className="text-lg">Request DJ Now</span>
                  </div>
                </button>

                <p className="text-sm text-zinc-500 text-center mt-4">
                  Average response time: 5-10 minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}