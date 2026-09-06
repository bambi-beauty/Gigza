import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, Calendar, MapPin, Filter, Star, ShieldCheck, LogOut, 
  User, Zap, ChevronDown, Music, Headphones, Clock, Sparkles, 
  TrendingUp, Briefcase, X, Heart, MessageCircle, Phone, 
  ArrowRight, Eye, Bell, LayoutGrid, List
} from "lucide-react";
import { useUser } from "./UserContext/ThisUserContext";
import { getAllDJs, getAvailableDJs, getVerifiedDJs } from "./services/djService";

export function HomeScreen() {
  const navigate = useNavigate();
  const { user, logout, getToken } = useUser();
  
  // State
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

  // Helper Functions
  const safeNumber = (value, defaultValue = 0) => {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  const formatRating = (rating) => {
    const num = safeNumber(rating, 0);
    return num.toFixed(1);
  };

  // Fetch DJs
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

  // Filter and sort DJs
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <div className="bg-zinc-900 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-zinc-700 shadow-xl">
          <div className="relative h-56 bg-zinc-800">
            <img
              src={dj.image || `https://placehold.co/800x400/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
              alt={dj.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 bg-black/70 p-2 hover:bg-black transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-5">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{dj.name}</h2>
                  <p className="text-zinc-300 text-sm">{dj.tagline || "Professional DJ"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white font-bold">{formatRating(dj.rating)}</span>
                  <span className="text-zinc-400 text-sm">({safeNumber(dj.review_count, 0)})</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-zinc-800 p-3 text-center">
                <p className="text-zinc-500 text-xs uppercase tracking-wider">Price</p>
                <p className="text-white font-semibold">R{safeNumber(dj.price, 150)}<span className="text-sm text-zinc-500">/hr</span></p>
              </div>
              <div className="bg-zinc-800 p-3 text-center">
                <p className="text-zinc-500 text-xs uppercase tracking-wider">Genre</p>
                <p className="text-white font-semibold">{dj.genre || "Electronic"}</p>
              </div>
              <div className="bg-zinc-800 p-3 text-center">
                <p className="text-zinc-500 text-xs uppercase tracking-wider">Location</p>
                <p className="text-white font-semibold truncate">{dj.location?.split(',')[0] || "Worldwide"}</p>
              </div>
              <div className="bg-zinc-800 p-3 text-center">
                <p className="text-zinc-500 text-xs uppercase tracking-wider">Experience</p>
                <p className="text-white font-semibold">{dj.years_experience || "Professional"}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link 
                to={`/dj/${dj.id}`}
                className="flex-1 bg-purple-600 text-white px-5 py-2.5 text-center font-medium hover:bg-purple-700 transition"
              >
                View Full Profile
              </Link>
              <button className="bg-zinc-700 text-white px-5 py-2.5 hover:bg-zinc-600 transition flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Message
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDJCard = (dj) => {
    const rating = safeNumber(dj.rating, 0);
    const price = safeNumber(dj.price, 150);
    const reviewCount = safeNumber(dj.review_count, 0);
    const isFavorite = favorites.includes(dj.id);
    
    return (
      <div
        key={dj.id}
        className="group bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-zinc-600 transition"
        onMouseEnter={() => setHoveredDJ(dj.id)}
        onMouseLeave={() => setHoveredDJ(null)}
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={dj.image || `https://placehold.co/400x300/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
            alt={dj.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            onError={(e) => {
              e.target.src = `https://placehold.co/400x300/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`;
            }}
          />
          
          <div className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition duration-300 ${
            hoveredDJ === dj.id ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={() => {
                setSelectedDJ(dj);
                setShowQuickView(true);
              }}
              className="bg-white text-black px-4 py-1.5 text-sm font-medium hover:bg-zinc-200 transition"
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Quick View
            </button>
            <Link
              to={`/dj/${dj.id}`}
              className="bg-purple-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-purple-700 transition"
            >
              View Profile
            </Link>
          </div>
          
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            <button
              onClick={() => toggleFavorite(dj.id)}
              className="bg-black/70 p-1.5 hover:bg-black transition"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
            <div className="bg-black/70 px-2 py-0.5 flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-white text-xs">{rating.toFixed(1)}</span>
              <span className="text-zinc-400 text-xs">({reviewCount})</span>
            </div>
          </div>
          
          {dj.verified && (
            <div className="absolute top-2 left-2 bg-blue-600 px-2 py-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-white" />
              <span className="text-white text-xs">Verified</span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-white font-semibold truncate">
                {dj.name || "Professional DJ"}
              </h3>
              <p className="text-zinc-400 text-sm line-clamp-1">{dj.tagline || "Professional DJ"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {dj.location?.split(',')[0] || "Worldwide"}
            </span>
            <span className="flex items-center gap-1">
              <Music className="w-3 h-3" />
              {dj.genre || "Electronic"}
            </span>
          </div>
          
          <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-white font-bold">R{price}</span>
              <span className="text-zinc-500 text-xs"> / hour</span>
            </div>
            <button
              onClick={() => navigate(`/book/${dj.id}`)}
              className="bg-purple-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-purple-700 transition"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDJListItem = (dj) => {
    const rating = safeNumber(dj.rating, 0);
    const price = safeNumber(dj.price, 150);
    const reviewCount = safeNumber(dj.review_count, 0);
    const isFavorite = favorites.includes(dj.id);
    
    return (
      <div className="group bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-zinc-600 transition">
        <div className="flex flex-col sm:flex-row">
          <div className="relative sm:w-40 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
            <img
              src={dj.image || `https://placehold.co/400x300/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
              alt={dj.name}
              className="w-full h-full object-cover"
            />
            {dj.verified && (
              <div className="absolute top-2 left-2 bg-blue-600 px-2 py-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-white" />
                <span className="text-white text-xs">Verified</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold">{dj.name}</h3>
                  <p className="text-zinc-400 text-sm">{dj.tagline || "Professional DJ"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    <span className="text-white">{rating.toFixed(1)}</span>
                    <span className="text-zinc-500 text-sm">({reviewCount})</span>
                  </div>
                  <button
                    onClick={() => toggleFavorite(dj.id)}
                    className="text-zinc-500 hover:text-red-400 transition"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-zinc-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {dj.location?.split(',')[0] || "Worldwide"}
                </span>
                <span className="flex items-center gap-1">
                  <Music className="w-4 h-4" />
                  {dj.genre || "Electronic"}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {dj.years_experience || "Professional"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
              <div>
                <span className="text-white font-bold text-lg">R{price}</span>
                <span className="text-zinc-500 text-sm"> / hour</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedDJ(dj);
                    setShowQuickView(true);
                  }}
                  className="text-zinc-400 hover:text-white px-3 py-1.5 border border-zinc-700 text-sm transition"
                >
                  Quick View
                </button>
                <Link
                  to={`/dj/${dj.id}`}
                  className="text-zinc-400 hover:text-white px-3 py-1.5 border border-zinc-700 text-sm transition"
                >
                  Profile
                </Link>
                <button
                  onClick={() => navigate(`/book/${dj.id}`)}
                  className="bg-purple-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-purple-700 transition"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSkeletons = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 overflow-hidden animate-pulse">
            <div className="h-48 bg-zinc-800" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-zinc-800 w-3/4" />
              <div className="h-3 bg-zinc-800 w-1/2" />
              <div className="h-8 bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderError = () => (
    <div className="text-center py-16">
      <div className="inline-block p-4 bg-red-500/10 mb-4">
        <X className="w-12 h-12 text-red-400" />
      </div>
      <p className="text-red-400 mb-4">{error}</p>
      <button
        onClick={fetchDJs}
        className="text-purple-400 hover:text-purple-300 transition font-medium"
      >
        Try Again →
      </button>
    </div>
  );

  const renderEmpty = () => (
    <div className="text-center py-16">
      <div className="inline-block p-4 bg-zinc-800 mb-4">
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
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-5 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              {/* <span className="text-xl font-bold">Gigza</span>
              <span className="text-xs text-zinc-500 font-medium">v2.0</span> */}
            </div>
            
            <div className="flex items-center gap-4">
              <button className="text-zinc-400 hover:text-white transition">
                <Bell className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 border border-zinc-700 px-3 py-1.5 hover:border-zinc-500 transition"
                >
                  <div className="w-7 h-7 bg-purple-600 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm hidden sm:inline">{user?.username || "User"}</span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>
                
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 shadow-xl z-20">
                      <div className="px-4 py-3 border-b border-zinc-800">
                        <p className="font-medium">{user?.username || "User"}</p>
                        <p className="text-zinc-400 text-sm">{user?.email || "user@example.com"}</p>
                      </div>
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-800 transition" onClick={() => setShowUserMenu(false)}>
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <Link to="/bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-800 transition" onClick={() => setShowUserMenu(false)}>
                        <Calendar className="w-4 h-4" /> My Bookings
                        <span className="ml-auto text-xs bg-purple-600 text-white px-2 py-0.5">3</span>
                      </Link>
                      <Link to="/emergency" className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 transition" onClick={() => setShowUserMenu(false)}>
                        <Zap className="w-4 h-4" /> Emergency SOS
                      </Link>
                      <hr className="border-zinc-800" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 transition">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-zinc-800 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-5 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Book the Best DJs<br />
              <span className="text-purple-400">For Your Event</span>
            </h1>
            
            <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
              Discover, compare, and book professional DJs for weddings, parties, corporate events, and more.
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="border border-zinc-700 bg-zinc-900 flex items-center">
                <div className="pl-4">
                  <Search className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search DJs by name, genre, or event type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-zinc-500 py-3 px-3 focus:outline-none"
                />
                <button className="bg-purple-600 text-white px-6 py-2.5 font-medium hover:bg-purple-700 transition">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending DJs */}
      {!loading && trendingDJs.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 py-6">
          <div className="border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                <div>
                  <h3 className="font-semibold">Trending DJs</h3>
                  <p className="text-zinc-400 text-sm">Most popular right now</p>
                </div>
              </div>
              <button className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingDJs.map((dj, index) => (
                <Link key={dj.id} to={`/dj/${dj.id}`} className="flex items-center gap-4 p-3 border border-zinc-800 hover:border-zinc-600 transition">
                  <div className="relative">
                    <div className="w-14 h-14 overflow-hidden">
                      <img
                        src={dj.image || `https://placehold.co/100x100/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
                        alt={dj.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                      #{index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium hover:text-purple-400 transition">{dj.name}</h4>
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
        </section>
      )}

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-5 py-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-400 text-sm">Genre:</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {["All", "Electronic", "Hip Hop", "House", "Techno", "R&B", "Pop", "Rock", "Latin", "Jazz"].map((genre) => (
                <button
                  key={genre}
                  onClick={() => setActiveGenre(genre)}
                  className={`whitespace-nowrap px-3 py-1 text-sm transition ${
                    activeGenre === genre
                      ? "bg-purple-600 text-white"
                      : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-1.5 border border-zinc-700 hover:border-zinc-500 transition"
            >
              {viewMode === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="rating">Top Rated</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
              <option value="name">Name A-Z</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 flex-wrap mb-5">
          <button
            onClick={() => {
              setShowOnlyAvailable(!showOnlyAvailable);
              setShowOnlyVerified(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition ${
              showOnlyAvailable
                ? "bg-green-600 text-white"
                : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
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
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition ${
              showOnlyVerified
                ? "bg-blue-600 text-white"
                : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
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
          <div className="border border-zinc-800 bg-zinc-900/50 p-5 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm text-zinc-400 block mb-2">Price Range</label>
                <div className="flex items-center gap-4">
                  <span className="text-sm">R{priceRange.min}</span>
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
                  <span className="text-sm">R{priceRange.max}</span>
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
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setPriceRange({ min: 0, max: 1000 });
                    setShowFilters(false);
                  }}
                  className="text-zinc-400 hover:text-white text-sm transition"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DJ Grid/Layout */}
        {loading ? (
          renderSkeletons()
        ) : error ? (
          renderError()
        ) : filteredDJs.length === 0 ? (
          renderEmpty()
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" 
            : "space-y-3"
          }>
            {filteredDJs.map((dj) => viewMode === "grid" ? renderDJCard(dj) : renderDJListItem(dj))}
          </div>
        )}
      </section>

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
    </div>
  );
}