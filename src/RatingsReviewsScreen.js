import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Star } from "lucide-react";

const mockBooking = {
  djName: "DJ Pulse",
  djImage: "https://images.unsplash.com/photo-1764510383709-14be6ec28548?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  eventType: "Wedding",
  date: "March 28, 2026",
};

export function RatingsReviewsScreen() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate("/bookings");
    }, 1500);
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
            <h1 className="text-2xl font-bold text-white">Rate & Review</h1>
            <p className="text-sm text-zinc-400">Share your experience</p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* DJ Info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <img
              src={mockBooking.djImage}
              alt={mockBooking.djName}
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div>
              <h3 className="font-semibold text-white text-lg">
                {mockBooking.djName}
              </h3>
              <p className="text-sm text-purple-400 mt-1">
                {mockBooking.eventType}
              </p>
              <p className="text-xs text-zinc-500 mt-1">{mockBooking.date}</p>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white text-center mb-2">
            How was your experience?
          </h2>
          <p className="text-sm text-zinc-400 text-center mb-6">
            Tap to rate
          </p>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-12 h-12 ${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-zinc-700"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-white font-semibold mt-4">
              {rating === 5 && "Excellent!"}
              {rating === 4 && "Great!"}
              {rating === 3 && "Good"}
              {rating === 2 && "Fair"}
              {rating === 1 && "Poor"}
            </p>
          )}
        </div>

        {/* Review */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Write a Review
          </h2>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell us about your experience with this DJ. What did you like? Any suggestions?"
            rows={8}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <p className="text-xs text-zinc-500 mt-2">
            {review.length} / 500 characters
          </p>
        </div>

        {/* Quick Tags */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Quick Tags (Optional)
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Professional",
              "Great Music",
              "On Time",
              "Energetic",
              "Crowd Pleaser",
              "Good Equipment",
            ].map((tag) => (
              <button
                key={tag}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full text-sm hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl shadow-lg shadow-purple-500/30"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>

        <p className="text-xs text-zinc-500 text-center">
          Your review will help other users make better decisions
        </p>
      </div>
    </div>
  );
}