import { useState } from "react";
import { Search, MapPin, Zap, Star, Filter, TrendingUp, Award, Users } from "lucide-react";
import { Link } from "react-router";

const mockDJs = [
  {
    id: 1,
    name: "DJ Pulse",
    image: "https://images.unsplash.com/photo-1764510383709-14be6ec28548?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    genre: "House / Techno",
    rating: 4.9,
    reviews: 127,
    price: 250,
    isBestMatch: true,
  },
  {
    id: 2,
    name: "Luna Beats",
    image: "https://images.unsplash.com/photo-1763630051863-fd7e36573b16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    genre: "EDM / Pop",
    rating: 4.8,
    reviews: 93,
    price: 200,
    isBestMatch: true,
  },
  {
    id: 3,
    name: "Max Voltage",
    image: "https://images.unsplash.com/photo-1549045469-68d0f4ce85c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    genre: "Hip Hop / RnB",
    rating: 4.7,
    reviews: 156,
    price: 300,
    isBestMatch: true,
  },
  {
    id: 4,
    name: "Neon Flow",
    image: "https://images.unsplash.com/photo-1723209943809-55527e4f6b24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    genre: "Trance / Progressive",
    rating: 4.6,
    reviews: 72,
    price: 180,
    isBestMatch: false,
  },
  {
    id: 5,
    name: "Echo Storm",
    image: "https://images.unsplash.com/photo-1712530708772-49749a0bad58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    genre: "Drum & Bass",
    rating: 4.8,
    reviews: 88,
    price: 220,
    isBestMatch: false,
  },
];

export function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const bestMatches = mockDJs.filter((dj) => dj.isBestMatch);
  const risingTalent = mockDJs.filter((dj) => !dj.isBestMatch);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-purple-900/30 via-black to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 pb-16 lg:pb-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Find Your Perfect DJ
              <span className="block mt-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                For Any Event
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              Book professional DJs for weddings, parties, corporate events, and more. Browse hundreds of talented artists ready to make your event unforgettable.
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search DJs, genres, events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-16 pr-6 py-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mt-6 justify-center">
                <button className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors">
                  <MapPin className="w-5 h-5" />
                  Location
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full transition-colors">
                  <Filter className="w-5 h-5" />
                  Genre
                </button>
                <button className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full transition-colors">
                  Price Range
                </button>
                <button className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full transition-colors">
                  Rating
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">500+</div>
                <div className="text-zinc-400">Professional DJs</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <Award className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">10,000+</div>
                <div className="text-zinc-400">Events Completed</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <Star className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">4.8/5</div>
                <div className="text-zinc-400">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best Matches */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-white">Best Matches For You</h2>
          <button className="text-purple-400 hover:text-purple-300 flex items-center gap-2 transition-colors">
            View All
            <TrendingUp className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestMatches.map((dj) => (
            <Link
              key={dj.id}
              to={`/dj/${dj.id}`}
              className="group bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-purple-500 transition-all hover:scale-[1.02]"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={dj.image}
                  alt={dj.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-white">{dj.rating}</span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-white mb-2">{dj.name}</h3>
                <p className="text-purple-400 mb-4">{dj.genre}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">{dj.reviews} reviews</span>
                  <span className="text-lg font-bold text-blue-400">${dj.price}/hr</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Rising Talent */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-white">Rising Talent</h2>
          <button className="text-purple-400 hover:text-purple-300 flex items-center gap-2 transition-colors">
            View All
            <TrendingUp className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {risingTalent.map((dj) => (
            <Link
              key={dj.id}
              to={`/dj/${dj.id}`}
              className="group bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-purple-500 transition-all hover:scale-[1.02]"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dj.image}
                  alt={dj.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1">{dj.name}</h3>
                <p className="text-sm text-purple-400 mb-3">{dj.genre}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-white">{dj.rating}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-400">${dj.price}/hr</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

