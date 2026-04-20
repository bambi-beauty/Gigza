import { useState } from "react";
import { Link } from "react-router";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Settings,
  LogOut,
  ChevronRight,
  Edit,
  Bell,
  Shield,
  HelpCircle,
  Star,
} from "lucide-react";

const mockUser = {
  name: "John Molefe",
  email: "john.molefe@email.com",
  phone: "+27 555 123 4567",
  location: "Johannesburg, SA",
  memberSince: "January 2024",
  verified: true,
  avatar: "https://images.unsplash.com/photo-1723209943809-55527e4f6b24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  stats: {
    bookings: 12,
    reviews: 8,
    favorite: 5,
  },
};

export function UserProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-black pb-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/30 to-black px-6 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <Link to="/settings" className="text-zinc-400 hover:text-white">
            <Settings className="w-6 h-6" />
          </Link>
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={mockUser.avatar}
              alt={mockUser.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-500"
            />
            {mockUser.verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-black">
                <Award className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{mockUser.name}</h2>
            <p className="text-sm text-zinc-400 mt-1">{mockUser.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-zinc-500">
                Member since {mockUser.memberSince}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-zinc-900 rounded-full p-2"
          >
            <Edit className="w-5 h-5 text-purple-400" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 bg-zinc-900 rounded-2xl p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{mockUser.stats.bookings}</p>
            <p className="text-xs text-zinc-400 mt-1">Bookings</p>
          </div>
          <div className="text-center border-x border-zinc-800">
            <p className="text-2xl font-bold text-white">{mockUser.stats.reviews}</p>
            <p className="text-xs text-zinc-400 mt-1">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{mockUser.stats.favorite}</p>
            <p className="text-xs text-zinc-400 mt-1">Favorites</p>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="px-6 mt-4 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Personal Information
        </h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
          <div className="flex items-center gap-3 p-4">
            <User className="w-5 h-5 text-purple-400" />
            <div className="flex-1">
              <p className="text-xs text-zinc-500">Full Name</p>
              <p className="text-white mt-1">{mockUser.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Mail className="w-5 h-5 text-purple-400" />
            <div className="flex-1">
              <p className="text-xs text-zinc-500">Email</p>
              <p className="text-white mt-1">{mockUser.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Phone className="w-5 h-5 text-purple-400" />
            <div className="flex-1">
              <p className="text-xs text-zinc-500">Phone</p>
              <p className="text-white mt-1">{mockUser.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <MapPin className="w-5 h-5 text-purple-400" />
            <div className="flex-1">
              <p className="text-xs text-zinc-500">Location</p>
              <p className="text-white mt-1">{mockUser.location}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings & Actions */}
      <div className="px-6 mt-6 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Settings & Preferences
        </h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
          <Link to="/notifications" className="flex items-center justify-between p-4 hover:bg-zinc-800 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-purple-400" />
              <span className="text-white">Notifications</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </Link>
          <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-800 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-white">Privacy & Security</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </button>
          <Link to="/dashboard" className="flex items-center justify-between p-4 hover:bg-zinc-800 transition-colors">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-purple-400" />
              <span className="text-white">Switch to DJ Mode</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </Link>
          <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-800 transition-colors">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              <span className="text-white">Help & Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </button>
        </div>
      </div>

      {/* Verification */}
      {!mockUser.verified && (
        <div className="px-6 mt-6">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  Get Verified
                </h3>
                <p className="text-sm text-zinc-400 mb-3">
                  Verify your account to unlock exclusive features and build trust
                </p>
                <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                  Start Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="px-6 mt-6">
        <button className="w-full bg-red-500/20 border border-red-500/50 text-red-400 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}