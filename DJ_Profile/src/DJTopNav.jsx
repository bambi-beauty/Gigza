import { Link, useLocation } from "react-router-dom";
import { Inbox, Calendar, Briefcase, Banknote, User } from "lucide-react";

const NAV_ITEMS = [
  { to: "/requests", label: "Requests", icon: Inbox },
  { to: "/dj-gigs", label: "My Gigs", icon: Calendar },
  { to: "/dashboard", label: "Earnings", icon: Banknote },
  { to: "/dj-portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/dj-profile", label: "Profile", icon: User },
];

export function DJTopNav() {
  const { pathname } = useLocation();
  // "/" renders the Requests screen, so treat it as active for Requests
  const isActive = (path) => pathname === path || (path === "/requests" && pathname === "/");

  return (
    <>
      <nav className="fixed top-0 w-full bg-black/90 border-b border-zinc-800 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-purple-500 p-1.5 rounded-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              GigZa <span className="text-purple-400">Pro</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  isActive(to) ? "bg-purple-500/20 text-purple-400" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile bottom bar: the top links are hidden below md */}
      <nav className="md:hidden fixed bottom-0 w-full bg-black/90 border-t border-zinc-800 backdrop-blur-md z-50">
        <div className="flex justify-around py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-xs ${
                isActive(to) ? "text-purple-400" : "text-zinc-500"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
