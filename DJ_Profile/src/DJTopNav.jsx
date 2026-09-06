import { Link, useLocation } from "react-router-dom";
import { Inbox, Calendar, Briefcase, Banknote } from "lucide-react";

export function DJTopNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full bg-black/90 border-b border-zinc-800 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-purple-500 p-1.5 rounded-lg">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">GigZa <span className="text-purple-400">Pro</span></span>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/requests" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${isActive('/requests') ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Inbox className="w-4 h-4" />
            <span className="font-medium text-sm">Requests</span>
          </Link>
          <Link to="/dj-gigs" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${isActive('/dj-gigs') ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Calendar className="w-4 h-4" />
            <span className="font-medium text-sm">My Gigs</span>
          </Link>
          <Link to="/dashboard" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${isActive('/dashboard') ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Banknote className="w-4 h-4" />
            <span className="font-medium text-sm">Earnings</span>
          </Link>
          <Link to="/dj-portfolio" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${isActive('/dj-portfolio') ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Briefcase className="w-4 h-4" />
            <span className="font-medium text-sm">Portfolio</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}