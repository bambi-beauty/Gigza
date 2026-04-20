import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  Star,
  MapPin,
  Music2,
  Award,
  Calendar,
  Play,
} from "lucide-react";

const mockDJ = {
  id: 1,
  name: "DJ Pulse",
  banner: "https://images.unsplash.com/photo-1761145090303-670cf0c19773?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  avatar: "https://images.unsplash.com/photo-1764510383709-14be6ec28548?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  genre: "House / Techno",
  experience: "8 years",
  location: "New York, NY",
  priceRange: "$250 - $500",
  rating: 4.9,
  reviewCount: 127,
  totalGigs: 342,
  verified: true,
  bio: "Professional DJ specializing in House and Techno. Available for clubs, private events, and weddings. Bringing high energy and unforgettable experiences.",
  portfolio: [
    "https://images.unsplash.com/photo-1619386113777-f92dd987bfb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    "https://images.unsplash.com/photo-1772772100444-dafaed462b60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    "https://images.unsplash.com/photo-1761145090303-670cf0c19773?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    "https://images.unsplash.com/photo-1619386113777-f92dd987bfb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  ],
  reviewsData: [
    {
      id: 1,
      user: "Sarah M.",
      rating: 5,
      comment: "Amazing performance! DJ Pulse absolutely killed it at our wedding. Everyone was dancing all night!",
      date: "March 2026",
    },
    {
      id: 2,
      user: "Mike R.",
      rating: 5,
      comment: "Professional, punctual, and talented. Highly recommend for any event.",
      date: "February 2026",
    },
    {
      id: 3,
      user: "Emily K.",
      rating: 4,
      comment: "Great DJ with excellent music selection. Would book again!",
      date: "January 2026",
    },
  ],
};

export function DJProfileScreen() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-black">
      {/* Banner & Header */}
      <div className="relative h-64 md:h-96 lg:h-[32rem]">
        <img
          src={mockDJ.banner}
          alt="Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <Link
          to="/"
          className="absolute top-6 left-6 bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </Link>
      </div>

      {/* Profile Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 lg:-mt-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile & Stats */}
            <div className="lg:col-span-2">
              <div className="flex items-end gap-6 mb-8">
                <img
                  src={mockDJ.avatar}
                  alt={mockDJ.name}
                  className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl border-4 border-black object-cover shadow-2xl"
                />
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">{mockDJ.name}</h1>
                    {mockDJ.verified && (
                      <div className="bg-blue-500 rounded-full p-1.5">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-purple-400 text-lg mt-2">{mockDJ.genre}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 bg-zinc-900 rounded-3xl p-6 mb-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-2xl font-bold text-white">
                      {mockDJ.rating}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{mockDJ.reviewCount} reviews</p>
                </div>
                <div className="text-center border-x border-zinc-800">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <span className="text-2xl font-bold text-white">
                      {mockDJ.totalGigs}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">Total Gigs</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-blue-400" />
                    <span className="text-2xl font-bold text-white">
                      {mockDJ.experience}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">Experience</p>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 text-zinc-300 text-lg">
                  <MapPin className="w-6 h-6 text-purple-400" />
                  <span>{mockDJ.location}</span>
                </div>
                <div className="flex items-center gap-4 text-zinc-300 text-lg">
                  <Music2 className="w-6 h-6 text-purple-400" />
                  <span>{mockDJ.genre}</span>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">About</h2>
                <p className="text-zinc-400 text-lg leading-relaxed">{mockDJ.bio}</p>
              </div>

              {/* Portfolio */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-6">Portfolio</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockDJ.portfolio.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer">
                      <img
                        src={img}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {index === 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="bg-white/30 backdrop-blur-sm rounded-full p-4 group-hover:bg-white/40 transition-colors">
                            <Play className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6">
                  Reviews ({mockDJ.reviewsData.length})
                </h2>
                <div className="space-y-4">
                  {mockDJ.reviewsData.map((review) => (
                    <div
                      key={review.id}
                      className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-white text-lg">
                          {review.user}
                        </span>
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 text-yellow-400 fill-yellow-400"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-zinc-400 leading-relaxed">{review.comment}</p>
                      <p className="text-sm text-zinc-600 mt-3">{review.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Booking Card (Sticky on Desktop) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
                  <div className="mb-6">
                    <p className="text-sm text-zinc-400 mb-2">Starting from</p>
                    <p className="text-3xl font-bold text-white">{mockDJ.priceRange}</p>
                    <p className="text-sm text-zinc-500 mt-1">per hour</p>
                  </div>
                  <Link
                    to={`/book/${id}`}
                    className="block w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold px-6 py-4 rounded-xl shadow-lg shadow-purple-500/30 text-center transition-all"
                  >
                    Book Now
                  </Link>
                  <p className="text-xs text-zinc-500 text-center mt-4">
                    Free cancellation up to 48 hours before the event
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}