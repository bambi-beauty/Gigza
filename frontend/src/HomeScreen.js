// src/HomeScreen.js - Updated with correct imports
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, Calendar, MapPin, Filter, Star, ShieldCheck, LogOut, 
  User, Zap, ChevronDown, Music, Headphones, 
  Clock, Sparkles, TrendingUp, Award, Briefcase, X, Heart,
  MessageCircle, Phone, Eye, LayoutGrid, LayoutList, Flame, Bell, Sun, Moon, Cloud,
  PartyPopper, Crown, Gem, Mic, Disc, Radio,
  Waves, Share2, Bookmark, Menu, ChevronRight, ChevronLeft,
  AlertCircle, AlertTriangle, Info, HelpCircle,
  Plus, Minus, Check, CheckCircle, Circle,
  Home, Settings, CreditCard, Mail, Lock, Key,
  Globe, Link2, Upload, Download, RefreshCw,
  Loader2, Wifi, WifiOff, Bluetooth, Battery,
  Camera, Video, Image, Film, Tv, Monitor,
  Smartphone, Tablet, Laptop, Watch, Speaker,
  Volume2, VolumeX, Mic2, Music2, Music3, Music4,
  Disc2, Disc3, RadioReceiver, Headphones as HeadphonesIcon,
  GalleryHorizontal, GalleryVertical, LayoutDashboard,
  Grid, List, ListChecks, ListMusic, ListVideo, ListX,
  UserPlus, UserMinus, UserCheck, UserX, Users,
  CalendarDays, CalendarClock, CalendarCheck, CalendarX,
  Clock1, Clock2, Clock3, Clock4, Clock5, Clock6,
  Clock7, Clock8, Clock9, Clock10, Clock11, Clock12,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight,
  Maximize, Minimize, ZoomIn, ZoomOut
} from "lucide-react";
import { useUser } from "./UserContext/ThisUserContext";
import { getAllDJs, getAvailableDJs, getVerifiedDJs } from "../src/services/djService";
import { getUserBookings } from "../src/services/bookingService";

// ============================================
// ANIMATED BACKGROUND COMPONENT
// ============================================
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow animation-delay-1000" />
    <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-pink-600/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
  </div>
);

// ============================================
// STATS CARD COMPONENT
// ============================================
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-lg hover:scale-105 transition-transform duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/70 text-xs uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

// ============================================
// TRENDING DJ TILE COMPONENT
// ============================================
const TrendingDJTile = ({ dj, index }) => {
  if (!dj) return null;
  
  const rating = parseFloat(dj.rating) || 0;
  
  const getRankColor = (idx) => {
    if (idx === 0) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    if (idx === 1) return 'bg-gradient-to-r from-gray-400 to-gray-500';
    return 'bg-gradient-to-r from-orange-400 to-amber-500';
  };

  return (
    <Link 
      to={`/dj/${dj.id || dj.dj_id}`}
      className="group flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300"
    >
      <div className="relative flex-shrink-0">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800">
          <img
            src={dj.image || `https://placehold.co/100x100/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
            alt={dj.name || 'DJ'}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.src = `https://placehold.co/100x100/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`;
            }}
          />
        </div>
        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${getRankColor(index)}`}>
          #{index + 1}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium group-hover:text-purple-400 transition truncate">
          {dj.name || "Professional DJ"}
        </h4>
        <p className="text-zinc-400 text-sm truncate">{dj.genre || "Electronic"}</p>
        {dj.is_verified && (
          <div className="flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400 text-xs">Verified</span>
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1 text-yellow-400">
          <Star className="w-3 h-3 fill-yellow-400" />
          <span className="text-white text-sm">{rating.toFixed(1)}</span>
        </div>
        <p className="text-zinc-500 text-xs">{parseInt(dj.review_count) || 0} reviews</p>
        {dj.is_online && (
          <div className="flex items-center justify-end gap-1 mt-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-500 text-xs">Online</span>
          </div>
        )}
      </div>
    </Link>
  );
};

// ============================================
// DJ CARD COMPONENT
// ============================================
const DJCard = ({ dj, isFavorite, onFavorite, onQuickView }) => {
  const [isHovered, setIsHovered] = useState(false);
  const rating = parseFloat(dj.rating) || 0;
  const price = parseFloat(dj.price) || 150;
  const reviewCount = parseInt(dj.total_reviews) || 0;
  
  const getRatingColor = (rating) => {
    if (rating >= 4.8) return 'from-yellow-400 to-orange-500';
    if (rating >= 4.5) return 'from-green-400 to-emerald-500';
    if (rating >= 4.0) return 'from-blue-400 to-cyan-500';
    return 'from-gray-400 to-gray-500';
  };

  return (
    <div
      className="group relative bg-zinc-900/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={dj.image || `https://placehold.co/400x300/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
          alt={dj.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.src = `https://placehold.co/400x300/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`;
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {dj.is_verified && (
            <div className="bg-blue-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <ShieldCheck className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-medium">Verified</span>
            </div>
          )}
          {dj.is_online && (
            <div className="bg-green-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs font-medium">Available Now</span>
            </div>
          )}
        </div>
        
        <div className={`absolute top-3 right-3 bg-gradient-to-r ${getRatingColor(rating)} px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg`}>
          <Star className="w-3 h-3 text-white fill-white" />
          <span className="text-white text-xs font-bold">{rating.toFixed(1)}</span>
        </div>
        
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => onQuickView(dj)}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/20 transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Quick View
          </button>
          <Link
            to={`/dj/${dj.id || dj.dj_id}`}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25 transition flex items-center gap-2"
          >
            <Music className="w-4 h-4" />
            Profile
          </Link>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate flex items-center gap-2">
              {dj.name || "Professional DJ"}
              {dj.is_verified && <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />}
            </h3>
            <p className="text-zinc-400 text-sm truncate">{dj.genre || "Electronic"}</p>
          </div>
          <button
            onClick={() => onFavorite(dj.id || dj.dj_id)}
            className="flex-shrink-0 ml-2 p-1.5 rounded-full hover:bg-white/10 transition"
          >
            <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-zinc-400 hover:text-red-400'}`} />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-1.5 mt-2">
          {dj.experience && (
            <span className="text-xs bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full border border-white/5">
              {dj.experience.includes('years') ? dj.experience : `${dj.experience} years exp`}
            </span>
          )}
          {dj.price_per_hour && (
            <span className="text-xs bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full border border-white/5">
              R{price}/hr
            </span>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-white">{rating.toFixed(1)}</span>
              <span>({reviewCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[60px]">Nearby</span>
            </div>
          </div>
          <Link
            to={`/book/${dj.id || dj.dj_id}`}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1.5 rounded-xl text-xs font-medium hover:shadow-lg hover:shadow-purple-500/25 transition"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN HOMESCREEN COMPONENT
// ============================================
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
  const [favorites, setFavorites] = useState([]);
  const [trendingDJs, setTrendingDJs] = useState([]);
  const [bookingCount, setBookingCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, online: 0, verified: 0 });
  
  const searchInputRef = useRef(null);
  const BASE_API = 'https://gigza-testing-11.onrender.com';

  const safeNumber = (value, defaultValue = 0) => {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  const formatRating = (rating) => {
    const num = safeNumber(rating, 0);
    return num.toFixed(1);
  };

  const fetchBookingCount = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const data = await getUserBookings();
      if (data && data.success && data.bookings) {
        setBookingCount(data.bookings.length);
      } else if (data && data.bookings) {
        setBookingCount(data.bookings.length);
      } else {
        setBookingCount(0);
      }
    } catch (error) {
      console.error("Error fetching booking count:", error);
      setBookingCount(0);
    }
  }, [getToken]);

  const fetchDJs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      
      if (showOnlyAvailable && showOnlyVerified) {
        data = await getAllDJs({ verified_only: true, available_only: true });
        const allDJs = data.djs || [];
        setDjs(allDJs);
      } else if (showOnlyAvailable) {
        data = await getAvailableDJs();
        const allDJs = data.available_djs || data.djs || [];
        setDjs(allDJs);
      } else if (showOnlyVerified) {
        data = await getVerifiedDJs();
        const allDJs = data.verified_djs || data.djs || [];
        setDjs(allDJs);
      } else {
        data = await getAllDJs();
        const allDJs = data.djs || [];
        setDjs(allDJs);
      }
      
      // Get the actual DJs array
      const allDJs = data.djs || data.available_djs || data.verified_djs || [];
      
      setStats({
        total: allDJs.length,
        online: allDJs.filter(d => d.is_online).length,
        verified: allDJs.filter(d => d.is_verified).length,
      });
      
      // Set trending DJs (top 3 by rating)
      if (allDJs.length > 0) {
        const sorted = [...allDJs].sort((a, b) => safeNumber(b.rating, 0) - safeNumber(a.rating, 0));
        setTrendingDJs(sorted.slice(0, 3));
      } else {
        setTrendingDJs([]);
      }
    } catch (err) {
      console.error("Error fetching DJs:", err);
      setError(err.message || "Failed to load DJs. Please try again later.");
      setDjs([]);
      setTrendingDJs([]);
    } finally {
      setLoading(false);
    }
  }, [showOnlyAvailable, showOnlyVerified]);

  useEffect(() => {
    fetchDJs();
    fetchBookingCount();
  }, [fetchDJs, fetchBookingCount]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const filteredDJs = djs.filter((dj) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (dj.name || "").toLowerCase().includes(searchLower) || 
                          (dj.genre || "").toLowerCase().includes(searchLower) ||
                          (dj.tagline || "").toLowerCase().includes(searchLower);
    const matchesGenre = activeGenre === "All" || (dj.genre || "") === activeGenre;
    const price = safeNumber(dj.price, 0);
    const matchesPrice = price >= priceRange.min && price <= priceRange.max;
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

  const handleQuickView = (dj) => {
    setSelectedDJ(dj);
    setShowQuickView(true);
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

  // Quick View Modal
  const QuickViewModal = ({ dj, onClose }) => {
    if (!dj) return null;
    const rating = safeNumber(dj.rating, 0);
    const price = safeNumber(dj.price, 150);
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
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
                  <span className="text-white font-bold">{formatRating(rating)}</span>
                  <span className="text-zinc-400">({safeNumber(dj.review_count, 0)})</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
                <p className="text-zinc-400 text-sm">Price</p>
                <p className="text-white font-bold">R{price}<span className="text-sm font-normal text-zinc-400">/hr</span></p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
                <p className="text-zinc-400 text-sm">Genre</p>
                <p className="text-white font-bold">{dj.genre || "Electronic"}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
                <p className="text-zinc-400 text-sm">Rating</p>
                <p className="text-white font-bold flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  {rating.toFixed(1)}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
                <p className="text-zinc-400 text-sm">Status</p>
                <p className={`font-bold ${dj.is_online ? 'text-green-400' : 'text-zinc-500'}`}>
                  {dj.is_online ? '🟢 Online' : '⚫ Offline'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link 
                to={`/dj/${dj.id || dj.dj_id}`}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition text-center"
              >
                View Full Profile
              </Link>
              <Link
                to={`/book/${dj.id || dj.dj_id}`}
                className="flex-1 bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition text-center"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const genres = ["All", "Electronic", "Hip Hop", "House", "Techno", "R&B", "Pop", "Rock", "Latin", "Jazz", "Amapiano", "Afrobeat"];

  return (
    <div className="min-h-screen bg-black text-white relative">
      <AnimatedBackground />
      
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-30 group-hover:opacity-50 transition" />
                <div className="relative w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold text-white hidden sm:inline">Gigza</span>
            </Link>
            
            <div className="flex-1 max-w-2xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-zinc-500" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search DJs, genres, or events... (⌘K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-zinc-500">
                  ⌘K
                </kbd>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-3 text-sm text-zinc-400">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {stats.online} Online
                </span>
              </div>
              
              <Link
                to="/emergency"
                className="hidden sm:flex items-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded-xl transition border border-red-500/20"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Emergency</span>
              </Link>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 transition group"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white hidden sm:inline">
                    {user?.username || "User"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-white transition" />
                </button>
                
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-white font-medium">{user?.username || "User"}</p>
                        <p className="text-zinc-400 text-sm truncate">{user?.email || "user@example.com"}</p>
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
                        {bookingCount > 0 && (
                          <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                            {bookingCount}
                          </span>
                        )}
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
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition text-left"
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Banner */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600/30 via-blue-600/20 to-pink-600/30 border border-white/10 p-8 md:p-12">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 text-sm font-medium">🔥 Trending Now</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Find Your Perfect DJ
              </h1>
              <p className="text-zinc-400 max-w-md">
                Discover top-rated DJs for your event. Book with confidence.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
              <StatCard 
                icon={Music} 
                label="Total DJs" 
                value={stats.total} 
                color="from-purple-500/20 to-purple-600/20"
              />
              <StatCard 
                icon={Clock} 
                label="Available Now" 
                value={stats.online} 
                color="from-green-500/20 to-green-600/20"
              />
              <StatCard 
                icon={ShieldCheck} 
                label="Verified" 
                value={stats.verified} 
                color="from-blue-500/20 to-blue-600/20"
              />
            </div>
          </div>
        </div>

        {/* Trending DJs */}
        {!loading && trendingDJs.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">⭐ Trending DJs</h2>
                <p className="text-zinc-400 text-sm">Most popular right now</p>
              </div>
              <button 
                onClick={() => setActiveGenre("All")}
                className="text-purple-400 hover:text-purple-300 transition text-sm flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingDJs.map((dj, index) => (
                <TrendingDJTile key={dj.id || dj.dj_id || index} dj={dj} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Show placeholder when no trending DJs */}
        {!loading && trendingDJs.length === 0 && djs.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">⭐ Trending DJs</h2>
                <p className="text-zinc-400 text-sm">Loading top DJs...</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {djs.slice(0, 100).map((dj, index) => (
                <TrendingDJTile key={dj.id || dj.dj_id || index} dj={dj} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-400 text-sm font-medium">Genre:</span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {genres.map((genre) => (
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
          
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
            >
              {viewMode === "grid" ? (
                <LayoutList className="w-4 h-4 text-white" />
              ) : (
                <LayoutGrid className="w-4 h-4 text-white" />
              )}
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="rating">⭐ Top Rated</option>
              <option value="price_low">💰 Price: Low → High</option>
              <option value="price_high">💰 Price: High → Low</option>
              <option value="name">📝 Name A-Z</option>
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
              className="text-zinc-500 hover:text-white transition text-sm flex items-center gap-1"
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
                <label className="text-sm text-zinc-400 block mb-2">💰 Price Range</label>
                <div className="flex items-center gap-4">
                  <span className="text-white text-sm">R{priceRange.min}</span>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) })}
                    className="flex-1 accent-purple-500 h-1"
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
                    className="flex-1 accent-purple-500 h-1"
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
            {filteredDJs.map((dj) => (
              <DJCard
                key={dj.id || dj.dj_id}
                dj={dj}
                isFavorite={favorites.includes(dj.id || dj.dj_id)}
                onFavorite={toggleFavorite}
                onQuickView={handleQuickView}
              />
            ))}
          </div>
        )}
      </main>

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

      {/* Floating Emergency Button */}
      <Link
        to="/emergency"
        className="fixed bottom-8 right-8 z-30 group"
      >
        <div className="absolute inset-0 bg-red-500 blur-xl opacity-40 group-hover:opacity-60 transition duration-300 animate-pulse" />
        <div className="relative bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-full shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 transition-all hover:scale-110 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          <span className="hidden sm:inline font-medium text-sm">Emergency</span>
        </div>
      </Link>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
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

export default HomeScreen;