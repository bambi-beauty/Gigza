// DJApplicationScreen.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, Music, Star, DollarSign, ArrowLeft, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useUser } from "./UserContext/ThisUserContext";

export function DJApplicationScreen() {
  const navigate = useNavigate();
  const { user, getToken } = useUser();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    dj_name: "",
    dj_experience: "",
    dj_skills: "",
    primary_genre: "",
    price_per_hour: 150
  });

  const genres = [
    "House", "Techno", "Hip Hop", "R&B", "Afrohouse", "Amapiano",
    "EDM", "Deep House", "Trance", "Dubstep", "Latin", "Pop", "Rock", "Jazz", "Classical"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const BASE_API = 'https://gigza-testing-11.onrender.com/api';
      
      const response = await fetch(`${BASE_API}/dj/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dj_name: formData.dj_name,
          dj_experience: formData.dj_experience,
          dj_skills: formData.dj_skills,
          primary_genre: formData.primary_genre,
          price_per_hour: formData.price_per_hour
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/profile");
        }, 2000);
      } else {
        throw new Error(data.message || "Application failed");
      }
    } catch (err) {
      console.error("Application error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/25">
            <Headphones className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Become a DJ</h1>
          <p className="text-zinc-400 mt-1">Join our community of professional DJs</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-green-400 font-semibold">Application Submitted Successfully!</p>
              <p className="text-green-400/70 text-sm">Redirecting to profile...</p>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
            {/* DJ Name */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                DJ Name <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                value={formData.dj_name}
                onChange={(e) => setFormData({ ...formData, dj_name: e.target.value })}
                placeholder="e.g., DJ Pulse Master"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <p className="text-zinc-500 text-xs mt-1">Your professional DJ name</p>
            </div>

            {/* Experience / Bio */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                Experience & Bio
              </label>
              <textarea
                value={formData.dj_experience}
                onChange={(e) => setFormData({ ...formData, dj_experience: e.target.value })}
                placeholder="Tell us about your DJ experience, past gigs, training, and what makes you unique..."
                rows={5}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <p className="text-zinc-500 text-xs mt-1">Share your journey as a DJ (optional but recommended)</p>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                Skills <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                value={formData.dj_skills}
                onChange={(e) => setFormData({ ...formData, dj_skills: e.target.value })}
                placeholder="e.g., Mixing, Scratching, Live Remixing, MC, Producing"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <p className="text-zinc-500 text-xs mt-1">Separate skills with commas</p>
            </div>

            {/* Primary Genre */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                Primary Genre <span className="text-purple-400">*</span>
              </label>
              <select
                value={formData.primary_genre}
                onChange={(e) => setFormData({ ...formData, primary_genre: e.target.value })}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select your primary genre</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Price Per Hour */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                Price Per Hour (R) <span className="text-purple-400">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="number"
                  value={formData.price_per_hour}
                  onChange={(e) => setFormData({ ...formData, price_per_hour: parseInt(e.target.value) })}
                  min="50"
                  max="1000"
                  step="10"
                  className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <p className="text-zinc-500 text-xs mt-1">Recommended range: R150 - R500 per hour</p>
            </div>

            {/* Info Box */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-zinc-300 text-sm font-medium">What happens next?</p>
                  <p className="text-zinc-400 text-sm mt-1">
                    Our team will review your application within 3-5 business days. 
                    You'll receive a notification once a decision is made.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Application
                </>
              )}
            </button>
          </form>
        )}

        {/* Already have a pending application? Check status */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/profile")}
            className="text-zinc-500 hover:text-purple-400 text-sm transition"
          >
            ← Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
}