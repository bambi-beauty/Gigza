import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, ShieldCheck, PlayCircle, Heart } from "lucide-react";
import { allDJs } from "./data"; // <-- Importing the same database!

export function DJProfileScreen() {
  const { id } = useParams(); // This grabs the "1" or "2" from the URL
  const navigate = useNavigate();
  
  // Find the exact DJ in our array that matches the ID from the URL
  const dj = allDJs.find(d => d.id === id);

  // If someone types a random ID in the URL, show an error
  if (!dj) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">DJ Not Found</h2>
        <button onClick={() => navigate(-1)} className="text-purple-400 hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Cover Image & Header */}
      <div className="relative h-80">
        <img
          src={dj.image}
          alt={dj.name}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Top Navigation Bar inside Profile */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
          <button onClick={() => navigate(-1)} className="bg-black/40 backdrop-blur-md p-3 rounded-full hover:bg-black/60 transition">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <button className="bg-black/40 backdrop-blur-md p-3 rounded-full hover:bg-black/60 transition text-zinc-400 hover:text-red-500">
            <Heart className="w-6 h-6" />
          </button>
        </div>

        {/* DJ Info Header */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold">
                  {dj.genre}
                </span>
                {dj.verified && (
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{dj.name}</h1>
              <div className="flex items-center gap-4 text-zinc-300 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {dj.location}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-white">{dj.rating}</span>
                  <span>({dj.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">About</h2>
            <p className="text-zinc-400 leading-relaxed">{dj.tagline}. An incredible artist ready to make your event unforgettable.</p>
          </div>
        </div>

        {/* Right Column: Booking Widget */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sticky top-28">
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-bold text-white">R{dj.price}</span>
              <span className="text-zinc-400">/ hour</span>
            </div>
            
            {/* The Book Now Button carries the exact ID to the next screen! */}
            <Link 
              to={`/checkout/${dj.id}`}
              className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-500/25"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}