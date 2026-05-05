import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Filter, Star, ShieldCheck, LogOut, User, Settings } from "lucide-react";
import { allDJs, genres } from "./data";
import { useUser } from "./UserContext/ThisUserContext";

export function HomeScreen() {
  const navigate = useNavigate();
  const { user, logout, getToken } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Filter DJs based on search query and genre
  const filteredDJs = allDJs.filter((dj) => {
    const matchesSearch = dj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dj.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = activeGenre === "All" || dj.genre === activeGenre;
    return matchesSearch && matchesGenre;
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      const token = getToken();
      if (token) {
        // Optional: Call logout endpoint
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
      {/* Header with Logout Button */}
      <div className="bg-gradient-to-b from-purple-900/40 via-black to-black pt-6 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Top Bar with User Menu */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center"> 
              </div>
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
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    <Link
                      to="/bookings"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      My Bookings
                    </Link>
                    <hr className="border-zinc-800" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Find Your Perfect DJ <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              For Any Event
            </span>
          </h1>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-8 text-sm md:text-base">
            Book professional DJs for weddings, parties, corporate events, and more.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search DJs by name or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-full py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 py-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 max-w-7xl mx-auto">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeGenre === genre
                  ? "bg-purple-500 text-white"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* DJ Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-xl font-bold text-white mb-6">
          {filteredDJs.length} {filteredDJs.length === 1 ? "DJ" : "DJs"} Found
        </h2>
        
        {filteredDJs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">No DJs found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveGenre("All");
              }}
              className="mt-4 text-purple-400 hover:text-purple-300 transition"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDJs.map((dj) => (
              <Link 
                key={dj.id} 
                to={`/dj/${dj.id}`} 
                className="group bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={dj.image}
                    alt={dj.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-white text-sm font-medium">{dj.rating}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {dj.name}
                        {dj.verified && <ShieldCheck className="w-4 h-4 text-blue-400" />}
                      </h3>
                      <p className="text-zinc-400 text-sm line-clamp-1">{dj.tagline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {dj.location.split(',')[0]}
                    </div>
                    <div className="flex items-center gap-1">
                      <Filter className="w-4 h-4" />
                      {dj.genre}
                    </div>
                  </div>
                  <div className="mt-5 pt-5 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold">R{dj.price}</span>
                      <span className="text-zinc-500 text-sm"> / hr</span>
                    </div>
                    <button className="bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium group-hover:bg-purple-500 transition-colors">
                      View Profile
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}