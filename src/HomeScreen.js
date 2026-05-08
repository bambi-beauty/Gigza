import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, Filter, Star, ShieldCheck, LogOut, User, Settings, Zap, ChevronDown, Music, Headphones, CheckCircle, Clock } from "lucide-react";
import { useUser } from "./UserContext/ThisUserContext";
import { getAllDJs, getAvailableDJs, getVerifiedDJs } from "./services/djService";

export function HomeScreen() {
  const navigate = useNavigate();
  const { user, logout, getToken } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState("rating");
  const [djs, setDjs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [genres, setGenres] = useState(["All", "Electronic", "Hip Hop", "House", "Techno", "R&B", "Pop", "Rock", "Latin", "Jazz"]);

  // Helper function to safely parse numbers
  const safeNumber = (value, defaultValue = 0) => {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Helper function to safely format rating
  const formatRating = (rating) => {
    const num = safeNumber(rating, 0);
    return num.toFixed(1);
  };

  // Fetch DJs from backend
  const fetchDJs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      
      if (showOnlyAvailable && showOnlyVerified) {
        data = await getAllDJs({ verified_only: true, available_only: true });
        setDjs(data.djs || []);
      } else if (showOnlyAvailable) {
        data = await getAvailableDJs();
        setDjs(data.available_djs || []);
      } else if (showOnlyVerified) {
        data = await getVerifiedDJs();
        setDjs(data.verified_djs || []);
      } else {
        data = await getAllDJs();
        setDjs(data.djs || []);
      }
    } catch (err) {
      console.error("Error fetching DJs:", err);
      setError(err.message || "Failed to load DJs. Please try again later.");
      setDjs([]);
    } finally {
      setLoading(false);
    }
  }, [showOnlyAvailable, showOnlyVerified]);

  useEffect(() => {
    fetchDJs();
  }, [fetchDJs]);

  // Filter DJs based on search query, genre, and price
  const filteredDJs = djs.filter((dj) => {
    const matchesSearch = (dj.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (dj.genre || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (dj.tagline || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = activeGenre === "All" || (dj.genre || "") === activeGenre;
    const matchesPrice = safeNumber(dj.price, 0) >= priceRange.min && safeNumber(dj.price, 0) <= priceRange.max;
    return matchesSearch && matchesGenre && matchesPrice;
  }).sort((a, b) => {
    const ratingA = safeNumber(a.rating, 0);
    const ratingB = safeNumber(b.rating, 0);
    const priceA = safeNumber(a.price, 0);
    const priceB = safeNumber(b.price, 0);
    const nameA = (a.name || "").toLowerCase();
    const nameB = (b.name || "").toLowerCase();
    
    switch(sortBy) {
      case "rating":
        return ratingB - ratingA;
      case "price_low":
        return priceA - priceB;
      case "price_high":
        return priceB - priceA;
      case "name":
        return nameA.localeCompare(nameB);
      default:
        return ratingB - ratingA;
    }
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => console.warn("Logout API error:", err));
      }
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      logout(); 
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/40 via-black to-black pt-6 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Top Bar with User Menu */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-xl hidden sm:block">Gigza</span>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full px-3 py-2 hover:bg-zinc-800 transition"
              >
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-white text-sm hidden sm:inline">
                  {user?.username || "User"}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/bookings"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>My Bookings</span>
                    </Link>
                    <Link
                      to="/emergency"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Emergency SOS</span>
                    </Link>
                    <hr className="border-zinc-800" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-center text-white mb-4">
            Find Your Perfect DJ <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              For Any Event
            </span>
          </h1>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-8 text-sm md:text-base">
            Book professional DJs for weddings, parties, corporate events, and more. Get instant quotes and confirmations.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search DJs by name, genre, or event type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-full py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-2">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => {
              setShowOnlyAvailable(!showOnlyAvailable);
              setShowOnlyVerified(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              showOnlyAvailable
                ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            Available Now
          </button>
          <button
            onClick={() => {
              setShowOnlyVerified(!showOnlyVerified);
              setShowOnlyAvailable(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              showOnlyVerified
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Verified Only
          </button>
          {(showOnlyAvailable || showOnlyVerified) && (
            <button
              onClick={() => {
                setShowOnlyAvailable(false);
                setShowOnlyVerified(false);
              }}
              className="text-zinc-500 text-sm hover:text-white transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 py-4 overflow-x-auto no-scrollbar border-b border-zinc-800">
        <div className="flex gap-3 max-w-7xl mx-auto">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeGenre === genre
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Sort and Filter Bar */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="rating">Top Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
        >
          <Filter className="w-4 h-4" />
          Price Filter
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        
        <button
          onClick={fetchDJs}
          className="text-sm text-purple-400 hover:text-purple-300 transition"
        >
          Refresh
        </button>
      </div>

      {/* Price Filter (expandable) */}
      {showFilters && (
        <div className="max-w-7xl mx-auto px-6 pb-4">
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
            <label className="text-sm text-zinc-400 mb-2 block">Price Range: R{priceRange.min} - R{priceRange.max}</label>
            <div className="flex gap-4">
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) })}
                className="flex-1 accent-purple-500"
              />
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                className="flex-1 accent-purple-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* DJ Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {loading ? "Loading..." : `${filteredDJs.length} ${filteredDJs.length === 1 ? "DJ" : "DJs"} Found`}
          </h2>
          {!loading && filteredDJs.length > 0 && (
            <p className="text-zinc-500 text-sm">
              {showOnlyAvailable && "Showing available DJs • "}
              {showOnlyVerified && "Showing verified DJs • "}
              Showing {filteredDJs.length} of {djs.length} DJs
            </p>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-zinc-400 mt-4">Loading DJs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md mx-auto">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchDJs}
                className="text-purple-400 hover:text-purple-300 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredDJs.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-zinc-900/50 rounded-2xl p-8 max-w-md mx-auto">
              <Headphones className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 mb-4">No DJs found matching your criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveGenre("All");
                  setPriceRange({ min: 0, max: 1000 });
                  setShowOnlyAvailable(false);
                  setShowOnlyVerified(false);
                }}
                className="text-purple-400 hover:text-purple-300 transition"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDJs.map((dj) => {
              const rating = safeNumber(dj.rating, 0);
              const price = safeNumber(dj.price, 150);
              const reviewCount = safeNumber(dj.review_count, 0);
              const yearsExperience = dj.years_experience || "Professional";
              
              return (
                <Link 
                  key={dj.id} 
                  to={`/dj/${dj.id}`} 
                  className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={dj.image || `https://placehold.co/400x300/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
                      alt={dj.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = `https://placehold.co/400x300/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`;
                      }}
                    />
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-white text-xs font-medium">{rating.toFixed(1)}</span>
                      <span className="text-zinc-400 text-xs">({reviewCount})</span>
                    </div>
                    {dj.verified && (
                      <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-white" />
                        <span className="text-white text-xs">Verified</span>
                      </div>
                    )}
                    {yearsExperience && typeof yearsExperience === 'string' && yearsExperience.includes('+') && (
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full">
                        <span className="text-white text-xs">{yearsExperience}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {dj.name || "Professional DJ"}
                          {dj.verified && <ShieldCheck className="w-4 h-4 text-blue-400" />}
                        </h3>
                        <p className="text-zinc-400 text-sm line-clamp-1">{dj.tagline || "Professional DJ for all events"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {dj.location?.split(',')[0] || "Available Worldwide"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        {dj.genre || "Electronic"}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="text-white font-bold text-lg">R{price}</span>
                        <span className="text-zinc-500 text-xs"> / hour</span>
                      </div>
                      <button className="bg-purple-500/10 text-purple-400 px-4 py-2 rounded-xl text-sm font-medium group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                        View Profile
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}