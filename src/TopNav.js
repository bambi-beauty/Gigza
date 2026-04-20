import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Bell, DollarSign, User, Zap } from "lucide-react";

export function TopNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left: Logo Section */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white text-xl">
            G
          </div>
          <span className="text-2xl font-bold text-white tracking-wide">GIGZA</span>
        </Link>

        {/* Center: Navigation Links */}
        <div className="hidden lg:flex items-center gap-2">
          <Link 
            to="/" 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors ${
              isActive('/') ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Discover</span>
          </Link>
          
          <Link 
            to="/bookings" 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors ${
              isActive('/bookings') ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Bookings</span>
          </Link>
          
          <Link 
            to="/notifications" 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors ${
              isActive('/notifications') ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">Notifications</span>
          </Link>

          <Link 
            to="/dashboard" 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors ${
              isActive('/dashboard') ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="font-medium">Earnings</span>
          </Link>

          <Link 
            to="/profile" 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors ${
              isActive('/profile') ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </Link>
        </div>

        {/* Right: Emergency DJ Button */}
        <Link 
          to="/emergency" 
          className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]"
        >
          <Zap className="w-5 h-5" />
          Emergency DJ
        </Link>
        
      </div>
    </div>
  );
}