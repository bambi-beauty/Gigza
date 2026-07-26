import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, Calendar, MapPin, Filter, Star, ShieldCheck, LogOut, 
  User, Settings, Zap, ChevronDown, Music, Headphones, CheckCircle, 
  Clock, Sparkles, TrendingUp, Award, Briefcase, X, Heart,
  ExternalLink, MessageCircle, Phone, Video, Crown, Gem, 
  ArrowRight, Play, Pause, Volume2, Mic2, Disc, Radio,
  Waves, Share2, Bookmark, Eye
} from "lucide-react";
import { useUser } from "./UserContext/ThisUserContext";
import { getAllDJs, getAvailableDJs, getVerifiedDJs } from "./services/djService";
import { Bell, LayoutGrid, List } from "lucide-react";

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
  const [viewMode, setViewMode] = useState("grid");
  const [selectedDJ, setSelectedDJ] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [hoveredDJ, setHoveredDJ] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [trendingDJs, setTrendingDJs] = useState([]);
  
  const searchInputRef = useRef(null);
  const BASE_API = 'https://gigza-testing-11.onrender.com/';

  const safeNumber = (value, defaultValue = 0) => {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  const formatRating = (rating) => {
    const num = safeNumber(rating, 0);
    return num.toFixed(1);
  };

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
      
      // Set trending DJs (top 3 by rating)
      if (data.djs) {
        const sorted = [...data.djs].sort((a, b) => safeNumber(b.rating, 0) - safeNumber(a.rating, 0));
        setTrendingDJs(sorted.slice(0, 3));
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

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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
      case "rating": return ratingB - ratingA;
      case "price_low": return priceA - priceB;
      case "price_high": return priceB - priceA;
      case "name": return nameA.localeCompare(nameB);
      default: return ratingB - ratingA;
    }
  });

  const toggleFavorite = (djId) => {
    setFavorites(prev => 
      prev.includes(djId) ? prev.filter(id => id !== djId) : [...prev, djId]
    );
  };

  const handleLogout = async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${BASE_API}/api/auth/logout`, {
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

  const QuickViewModal = ({ dj, onClose }) => {
    if (!dj) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-800 shadow-2xl">
          <div className="relative h-64 md:h-80">
            <img
              src={dj.image || `https://placehold.co/800x400/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
              alt={dj.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/70 backdrop-blur-md p-2 rounded-full hover:bg-black/90 transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-6">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">{dj.name}</h2>
                  <p className="text-zinc-300">{dj.tagline || "Professional DJ"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white font-bold">{formatRating(dj.rating)}</span>
                  <span className="text-zinc-400">({safeNumber(dj.review_count, 0)})</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <p className="text-zinc-400 text-sm">Price</p>
                <p className="text-white font-bold">R{safeNumber(dj.price, 150)}<span className="text-sm font-normal text-zinc-400">/hr</span></p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <p className="text-zinc-400 text-sm">Genre</p>
                <p className="text-white font-bold">{dj.genre || "Electronic"}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <p className="text-zinc-400 text-sm">Location</p>
                <p className="text-white font-bold truncate">{dj.location?.split(',')[0] || "Worldwide"}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <p className="text-zinc-400 text-sm">Experience</p>
                <p className="text-white font-bold">{dj.years_experience || "Professional"}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link 
                to={`/dj/${dj.id}`}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition text-center"
              >
                View Full Profile
              </Link>
              <button className="bg-zinc-800 text-white px-6 py-3 rounded-xl font-medium hover:bg-zinc-700 transition flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Message
              </button>
              <button className="bg-zinc-800 text-white px-6 py-3 rounded-xl font-medium hover:bg-zinc-700 transition flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Call
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Animated Background */}
      <div className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/20 animate-gradient" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        {/* Header */}
        <div className="relative px-6 pt-6 pb-20">
          <div className="max-w-7xl mx-auto">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500 blur-xl opacity-30 animate-pulse" />
                  <div className="relative w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <span className="text-white font-bold text-xl">Gigza</span>
                  <span className="text-xs text-purple-400 ml-2 font-medium">v2.0</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Quick actions */}
                <button className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-white transition text-sm">
                  <Bell className="w-4 h-4" />
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-3 py-2 hover:bg-white/10 transition group"
                  >
                    <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white text-sm hidden sm:inline">
                      {user?.username || "User"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-white transition" />
                  </button>
                  
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-white font-medium">{user?.username || "User"}</p>
                          <p className="text-zinc-400 text-sm">{user?.email || "user@example.com"}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          to="/bookings"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Calendar className="w-4 h-4" />
                          <span>My Bookings</span>
                          <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">3</span>
                        </Link>
                        <Link
                          to="/emergency"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Zap className="w-4 h-4" />
                          <span>Emergency SOS</span>
                        </Link>
                        <hr className="border-white/5" />
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
            </div>
            
            {/* Hero Content */}
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-white text-sm">Find your perfect DJ in seconds</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Book the Best DJs
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                  For Your Event
                </span>
              </h1>
              
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10">
                Discover, compare, and book professional DJs for weddings, parties, corporate events, and more. 
                Get instant quotes and secure your date today.
              </p>

              {/* Enhanced Search Bar */}
              <div className="max-w-3xl mx-auto relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition" />
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2 flex items-center gap-2">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search DJs by name, genre, or event type... (⌘K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder-zinc-500 py-3 pl-12 pr-4 focus:outline-none"
                  />
                  <kbd className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-zinc-400">
                    <span>⌘</span>
                    <span>K</span>
                  </kbd>
                  <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition">
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trending DJs Section */}
      {!loading && trendingDJs.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Trending DJs</h3>
                  <p className="text-zinc-400 text-sm">Most popular right now</p>
                </div>
              </div>
              <button className="text-purple-400 hover:text-purple-300 transition text-sm flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingDJs.map((dj, index) => (
                <Link 
                  key={dj.id} 
                  to={`/dj/${dj.id}`}
                  className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition group"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl overflow-hidden">
                      <img
                        src={dj.image || `https://placehold.co/100x100/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
                        alt={dj.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      #{index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium group-hover:text-purple-400 transition">
                      {dj.name}
                    </h4>
                    <p className="text-zinc-400 text-sm">{dj.genre || "Electronic"}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-3 h-3 fill-yellow-400" />
                      <span className="text-white text-sm">{formatRating(dj.rating)}</span>
                    </div>
                    <p className="text-zinc-400 text-xs">{safeNumber(dj.review_count, 0)} reviews</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Bar with Enhanced UI */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-zinc-400 text-sm font-medium">Genre:</span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {["All", "Electronic", "Hip Hop", "House", "Techno", "R&B", "Pop", "Rock", "Latin", "Jazz"].map((genre) => (
                <button
                  key={genre}
                  onClick={() => setActiveGenre(genre)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeGenre === genre
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25"
                      : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
            >
              {viewMode === "grid" ? (
                <LayoutGrid className="w-4 h-4 text-white" />
              ) : (
                <List className="w-4 h-4 text-white" />
              )}
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="rating">Top Rated</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
              <option value="name">Name A-Z</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-3 flex-wrap mb-6">
          <button
            onClick={() => {
              setShowOnlyAvailable(!showOnlyAvailable);
              setShowOnlyVerified(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              showOnlyAvailable
                ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
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
                : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Verified Only
          </button>
          {(showOnlyAvailable || showOnlyVerified) && (
            <button
              onClick={() => {
                setShowOnlyAvailable(false);
                setShowOnlyVerified(false);
              }}
              className="text-zinc-500 text-sm hover:text-white transition flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
          <div className="flex-1" />
          <span className="text-zinc-500 text-sm self-center">
            {filteredDJs.length} DJs found
          </span>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6 animate-slideDown">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-zinc-400 block mb-2">Price Range</label>
                <div className="flex items-center gap-4">
                  <span className="text-white text-sm">R{priceRange.min}</span>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) })}
                    className="flex-1 accent-purple-500"
                  />
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-white text-sm">R{priceRange.max}</span>
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
              <div className="flex items-end gap-4">
                <button
                  onClick={() => {
                    setPriceRange({ min: 0, max: 1000 });
                    setShowFilters(false);
                  }}
                  className="text-zinc-400 hover:text-white transition text-sm"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DJ Grid/Layout */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-8 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="inline-block p-4 bg-red-500/10 rounded-full mb-4">
              <X className="w-12 h-12 text-red-400" />
            </div>
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={fetchDJs}
              className="text-purple-400 hover:text-purple-300 transition font-medium"
            >
              Try Again →
            </button>
          </div>
        ) : filteredDJs.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-4 bg-white/5 rounded-full mb-4">
              <Headphones className="w-12 h-12 text-zinc-500" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">No DJs Found</h3>
            <p className="text-zinc-400 mb-4">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveGenre("All");
                setPriceRange({ min: 0, max: 1000 });
                setShowOnlyAvailable(false);
                setShowOnlyVerified(false);
              }}
              className="text-purple-400 hover:text-purple-300 transition font-medium"
            >
              Clear All Filters →
            </button>
          </div>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {filteredDJs.map((dj) => {
              const rating = safeNumber(dj.rating, 0);
              const price = safeNumber(dj.price, 150);
              const reviewCount = safeNumber(dj.review_count, 0);
              const isFavorite = favorites.includes(dj.id);
              
              return viewMode === "grid" ? (
                <div
                  key={dj.id}
                  className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1"
                  onMouseEnter={() => setHoveredDJ(dj.id)}
                  onMouseLeave={() => setHoveredDJ(null)}
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={dj.image || `https://placehold.co/400x300/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
                      alt={dj.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.target.src = `https://placehold.co/400x300/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`;
                      }}
                    />
                    
                    {/* Quick action overlay */}
                    <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3 transition-opacity duration-300 ${
                      hoveredDJ === dj.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <button
                        onClick={() => {
                          setSelectedDJ(dj);
                          setShowQuickView(true);
                        }}
                        className="bg-white text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-200 transition flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Quick View
                      </button>
                      <Link
                        to={`/dj/${dj.id}`}
                        className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-600 transition"
                      >
                        View Profile
                      </Link>
                    </div>
                    
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <button
                        onClick={() => toggleFavorite(dj.id)}
                        className="bg-black/70 backdrop-blur-md p-2 rounded-full hover:bg-black/90 transition"
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                      </button>
                      <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-white text-xs font-medium">{rating.toFixed(1)}</span>
                        <span className="text-zinc-400 text-xs">({reviewCount})</span>
                      </div>
                    </div>
                    
                    {dj.verified && (
                      <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-medium">Verified</span>
                      </div>
                    )}
                    
                    {dj.years_experience && typeof dj.years_experience === 'string' && dj.years_experience.includes('+') && (
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full">
                        <span className="text-white text-xs">{dj.years_experience}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 truncate">
                          {dj.name || "Professional DJ"}
                          {dj.verified && <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                        </h3>
                        <p className="text-zinc-400 text-sm line-clamp-1">{dj.tagline || "Professional DJ for all events"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{dj.location?.split(',')[0] || "Available Worldwide"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        <span>{dj.genre || "Electronic"}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-white font-bold text-lg">R{price}</span>
                        <span className="text-zinc-500 text-xs"> / hour</span>
                      </div>
                      <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25 transition">
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // List View
                <div
                  key={dj.id}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                      <img
                        src={dj.image || `https://placehold.co/400x300/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
                        alt={dj.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          e.target.src = `https://placehold.co/400x300/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`;
                        }}
                      />
                      {dj.verified && (
                        <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-white" />
                          <span className="text-white text-xs font-medium">Verified</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-white">{dj.name}</h3>
                            <p className="text-zinc-400">{dj.tagline || "Professional DJ"}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Star className="w-4 h-4 fill-yellow-400" />
                              <span className="text-white font-medium">{rating.toFixed(1)}</span>
                              <span className="text-zinc-400 text-sm">({reviewCount})</span>
                            </div>
                            <button
                              onClick={() => toggleFavorite(dj.id)}
                              className="text-zinc-400 hover:text-red-400 transition"
                            >
                              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-zinc-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {dj.location?.split(',')[0] || "Available Worldwide"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Music className="w-4 h-4" />
                            {dj.genre || "Electronic"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {dj.years_experience || "Professional"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                        <div>
                          <span className="text-white font-bold text-xl">R{price}</span>
                          <span className="text-zinc-500 text-sm"> / hour</span>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setSelectedDJ(dj);
                              setShowQuickView(true);
                            }}
                            className="text-zinc-400 hover:text-white transition px-4 py-2 border border-white/10 rounded-xl"
                          >
                            Quick View
                          </button>
                          <Link
                            to={`/dj/${dj.id}`}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {showQuickView && (
        <QuickViewModal 
          dj={selectedDJ} 
          onClose={() => {
            setShowQuickView(false);
            setSelectedDJ(null);
          }} 
        />
      )}

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-full shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/50 transition-all hover:scale-110">
        <MessageCircle className="w-6 h-6" />
      </button>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 10s ease infinite;
          background-size: 200% 200%;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// Import missing icons
