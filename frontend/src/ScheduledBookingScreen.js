import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Music2 } from "lucide-react";

const eventTypes = [
  "Wedding",
  "Birthday Party",
  "Corporate Event",
  "Club Night",
  "Private Party",
  "Festival",
];

const genres = [
  "House",
  "Techno",
  "Hip Hop",
  "EDM",
  "RnB",
  "Trance",
  "Drum & Bass",
  "Pop",
];

export function ScheduledBookingScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("4");
  const [eventType, setEventType] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [location, setLocation] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [budget, setBudget] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSubmit = () => {
    // Navigate to payment screen
    navigate(`/payment/booking-${Date.now()}`);
  };

  return (
    <div className="min-h-screen bg-black pb-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/30 to-black px-6 pt-6 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-zinc-900 rounded-full p-2"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Book DJ</h1>
            <p className="text-sm text-zinc-400">Schedule your event</p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Date & Time */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Date & Time
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Event Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  Start Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  Duration (hrs)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Event Type */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Event Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() => setEventType(type)}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                  eventType === type
                    ? "bg-purple-500 text-white"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Genre Selection */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Preferred Genres
          </h2>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedGenres.includes(genre)
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Event Details */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Event Details
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter venue address"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Expected Guests
              </label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="Number of guests"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Budget */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Budget</h2>
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">
              Total Budget ($)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Enter your budget"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Additional Notes
          </h2>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any special requests or requirements..."
            rows={4}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-purple-500/30"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}