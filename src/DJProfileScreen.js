import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, ShieldCheck, Heart, Loader2 } from "lucide-react";
import { getDJById } from "./services/djService";
import { useUser } from "./UserContext/ThisUserContext";

export function DJProfileScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useUser();
  
  const [dj, setDj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Helper function to safely parse numbers
  const safeNumber = (value, defaultValue = 0) => {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Fetch DJ data from backend when component mounts
  useEffect(() => {
    const fetchDJDetails = async () => {
      try {
        setLoading(true);
        const data = await getDJById(id);
        
        if (data.success && data.dj) {
          // Convert numeric fields safely
          const djData = {
            ...data.dj,
            rating: safeNumber(data.dj.rating, 0),
            price: safeNumber(data.dj.price, 150),
            review_count: safeNumber(data.dj.review_count, 0)
          };
          setDj(djData);
        } else {
          setError("DJ not found");
        }
      } catch (err) {
        console.error("Error fetching DJ details:", err);
        setError("Failed to load DJ profile");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDJDetails();
    }
  }, [id]);

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-zinc-400">Loading DJ profile...</p>
      </div>
    );
  }

  // Handle error state
  if (error || !dj) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">DJ Not Found</h2>
        <p className="text-zinc-400 mb-6">{error || "The DJ you're looking for doesn't exist."}</p>
        <button onClick={() => navigate(-1)} className="text-purple-400 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Cover Image & Header */}
      <div className="relative h-80">
        <img
          src={dj.image || `https://placehold.co/800x400/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
          alt={dj.name}
          className="w-full h-full object-cover opacity-60"
          onError={(e) => {
            e.target.src = `https://placehold.co/800x400/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Top Navigation Bar inside Profile */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
          <button onClick={() => navigate(-1)} className="bg-black/40 backdrop-blur-md p-3 rounded-full hover:bg-black/60 transition">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={() => setIsFavorite(!isFavorite)}
            className="bg-black/40 backdrop-blur-md p-3 rounded-full hover:bg-black/60 transition"
          >
            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`} />
          </button>
        </div>

        {/* DJ Info Header */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold">
                  {dj.genre || "Electronic"}
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
                  <MapPin className="w-4 h-4" /> {dj.location || "Available nationwide"}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-white">{dj.rating.toFixed(1)}</span>
                  <span>({dj.review_count} reviews)</span>
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
            <h2 className="text-xl font-bold text-white mb-4">About {dj.name}</h2>
            <p className="text-zinc-400 leading-relaxed">
              {dj.tagline || dj.bio || `${dj.name} is a professional DJ ready to make your event unforgettable.`}
            </p>
          </div>
          
          {/* Skills/Genres Section */}
          {dj.skills && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Skills & Genres</h2>
              <div className="flex flex-wrap gap-2">
                {typeof dj.skills === 'string' 
                  ? dj.skills.split(',').slice(0, 6).map((skill, i) => (
                      <span key={i} className="bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full text-sm">
                        {skill.trim()}
                      </span>
                    ))
                  : dj.skills?.slice(0, 6).map((skill, i) => (
                      <span key={i} className="bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full text-sm">
                        {skill}
                      </span>
                    ))
                }
              </div>
            </div>
          )}

          {/* Experience Section */}
          {dj.years_experience && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Experience</h2>
              <p className="text-zinc-400">{dj.years_experience}</p>
            </div>
          )}
        </div>

        {/* Right Column: Booking Widget */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sticky top-28">
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-bold text-white">R{dj.price}</span>
              <span className="text-zinc-400">/hour</span>
            </div>
            
            {/* The Book Now Button - Passes the DJ ID */}
            <Link 
              to={`/checkout/${dj.id}`}
              className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-500/25"
            >
              Book Now
            </Link>
            
            <p className="text-xs text-zinc-500 text-center mt-4">
              Free cancellation up to 24 hours before event
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}