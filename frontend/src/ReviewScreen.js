import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft, CheckCircle2, MessageSquare } from "lucide-react";

export function ReviewScreen() {
  const { bookingId } = useParams(); // Grabs the specific booking ID from the URL
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    // Find the specific booking they clicked on from memory
    const savedBookings = JSON.parse(localStorage.getItem("gigzaBookings")) || [];
    const foundBooking = savedBookings.find(b => b.id === bookingId);
    setBooking(foundBooking);
  }, [bookingId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return; // Don't let them submit 0 stars!

    setIsSubmitting(true);

    // Simulate a brief loading state
    setTimeout(() => {
      // 1. Create the new review object
      const newReview = {
        id: `REV-${Date.now()}`,
        bookingId: booking.id,
        djName: booking.djName,
        rating: rating,
        comment: comment,
        date: new Date().toLocaleDateString()
      };

      // 2. Save the review to a new array in localStorage
      const existingReviews = JSON.parse(localStorage.getItem("gigzaReviews")) || [];
      localStorage.setItem("gigzaReviews", JSON.stringify([newReview, ...existingReviews]));

      // 3. Update the original booking to say "Reviewed" so they can't review it twice
      const savedBookings = JSON.parse(localStorage.getItem("gigzaBookings")) || [];
      const updatedBookings = savedBookings.map(b => 
        b.id === bookingId ? { ...b, status: "Reviewed" } : b
      );
      localStorage.setItem("gigzaBookings", JSON.stringify(updatedBookings));

      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Send them back to their dashboard after seeing the success message
      setTimeout(() => navigate('/bookings'), 2000);
    }, 1500);
  };

  // If the booking hasn't loaded yet, show a black screen
  if (!booking) return <div className="min-h-screen bg-black"></div>;

  // The Success Screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Review Submitted!</h1>
        <p className="text-zinc-400">Thanks for supporting {booking.djName}.</p>
      </div>
    );
  }

  // The Main Review Form
  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/30 to-black px-6 pt-6 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="bg-zinc-900 rounded-full p-2">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">Rate Your Experience</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-8 mt-4">
        
        {/* DJ Info Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center text-center">
          <img 
            src={booking.djImage} 
            alt={booking.djName} 
            className="w-24 h-24 rounded-full object-cover border-4 border-zinc-800 mb-4"
          />
          <h2 className="text-xl font-bold text-white">How was {booking.djName}?</h2>
          <p className="text-zinc-400 text-sm mt-1">{booking.eventType} • {booking.date}</p>
        </div>

        {/* The Review Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Interactive Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star 
                  className={`w-10 h-10 transition-colors ${
                    (hoveredRating || rating) >= star 
                      ? "text-yellow-500 fill-yellow-500 shadow-yellow-500" 
                      : "text-zinc-700"
                  }`} 
                />
              </button>
            ))}
          </div>
          <p className="text-center text-purple-400 font-semibold h-6">
            {rating === 1 && "Terrible"}
            {rating === 2 && "Not Great"}
            {rating === 3 && "It was Okay"}
            {rating === 4 && "Great DJ"}
            {rating === 5 && "Absolutely Incredible!"}
          </p>

          {/* Comment Box */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="flex items-center gap-2 text-zinc-300 font-medium mb-3">
              <MessageSquare className="w-4 h-4" /> Share your thoughts
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`What did you love about ${booking.djName}'s set?`}
              className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 h-32 resize-none"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 flex justify-center items-center"
          >
            {isSubmitting ? "Submitting..." : "Post Review"}
          </button>
        </form>

      </div>
    </div>
  );
}