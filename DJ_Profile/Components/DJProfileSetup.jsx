// Components/DJProfileSetup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  User, Music, MapPin, DollarSign, Camera, ArrowRight, 
  Loader2, Sparkles, CheckCircle, X, Save
} from "lucide-react";

const BASE_API = 'https://gigza-testing-11.onrender.com/api';

export function DJProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [profileData, setProfileData] = useState({
    stage_name: "",
    bio: "",
    city: "",
    province: "",
    experience_years: "",
    price_per_hour: "",
    phone: "",
    profile_picture: null,
    genres: []
  });

  const [genresList, setGenresList] = useState([
    "Amapiano", "House", "Gqom", "Hip Hop", "Afro House", 
    "Deep House", "Techno", "Kwaito", "R&B", "Pop", "Jazz"
  ]);

  const email = location.state?.email || localStorage.getItem("newUserEmail");
  const isNewDJ = location.state?.isNewDJ || localStorage.getItem("isNewDJ") === "true";

  useEffect(() => {
    if (!email) {
      navigate("/dj-login");
    }
  }, [email, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File size should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData(prev => ({ ...prev, profile_picture: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const toggleGenre = (genre) => {
    setProfileData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleSaveProfile = async () => {
    // Validate
    if (!profileData.stage_name.trim()) {
      setError("Stage name is required");
      return;
    }
    if (!profileData.city.trim()) {
      setError("City is required");
      return;
    }
    if (!profileData.price_per_hour || isNaN(profileData.price_per_hour)) {
      setError("Please enter a valid price per hour");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${BASE_API}/dj/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stage_name: profileData.stage_name,
          bio: profileData.bio,
          city: profileData.city,
          province: profileData.province,
          experience_years: profileData.experience_years,
          price_per_hour: profileData.price_per_hour,
          phone: profileData.phone,
          profile_picture: profileData.profile_picture,
          genres: profileData.genres
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        localStorage.setItem("profileCompleted", "true");
        
        // Update user data
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        user.profile_completed = true;
        user.profile = data.profile || data.dj_profile;
        localStorage.setItem("user", JSON.stringify(user));
        
        // ✅ Navigate to DJ Application
        setTimeout(() => {
          navigate("/dj-application");
        }, 2000);
      } else {
        setError(data.message || "Failed to save profile");
      }
    } catch (err) {
      console.error("Profile save error:", err);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      return profileData.stage_name.trim().length > 0;
    }
    if (currentStep === 2) {
      return profileData.city.trim().length > 0 && profileData.price_per_hour > 0;
    }
    return true;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Complete! 🎉</h2>
          <p className="text-zinc-400">Your DJ profile has been set up.</p>
          <p className="text-zinc-500 text-sm mt-2">Taking you to the DJ application...</p>
          <div className="mt-4 flex justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set Up Your DJ Profile</h1>
          <p className="text-zinc-400 text-sm mt-1">Tell the world about your DJ brand</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex-1 mx-1">
              <div className={`h-1 rounded-full transition-all duration-300 ${currentStep >= step ? 'bg-purple-500' : 'bg-zinc-800'}`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mb-6 text-xs text-zinc-500">
          <span className={currentStep === 1 ? "text-purple-400" : ""}>Identity</span>
          <span className={currentStep === 2 ? "text-purple-400" : ""}>Location & Rate</span>
          <span className={currentStep === 3 ? "text-purple-400" : ""}>Music & Bio</span>
        </div>

        {/* Step 1: Identity */}
        {currentStep === 1 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                  {profileData.profile_picture ? (
                    <img src={profileData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden" 
                  id="profile-upload"
                />
                <label 
                  htmlFor="profile-upload"
                  className="absolute bottom-0 right-0 bg-purple-500 p-1.5 rounded-full border-2 border-black cursor-pointer hover:bg-purple-600 transition"
                >
                  <Camera className="w-3 h-3 text-white" />
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                Stage Name <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                name="stage_name"
                value={profileData.stage_name}
                onChange={handleInputChange}
                placeholder="e.g., DJ Pulse"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
                placeholder="+27 XX XXX XXXX"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={nextStep}
                disabled={!isStepValid()}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location & Rate */}
        {currentStep === 2 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6">
            <div className="mb-4">
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                City <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={profileData.city}
                onChange={handleInputChange}
                placeholder="e.g., Johannesburg"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

            <div className="mb-4">
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                Province
              </label>
              <select
                name="province"
                value={profileData.province}
                onChange={handleInputChange}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              >
                <option value="">Select Province</option>
                <option value="Gauteng">Gauteng</option>
                <option value="Western Cape">Western Cape</option>
                <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                <option value="Eastern Cape">Eastern Cape</option>
                <option value="Free State">Free State</option>
                <option value="Limpopo">Limpopo</option>
                <option value="Mpumalanga">Mpumalanga</option>
                <option value="North West">North West</option>
                <option value="Northern Cape">Northern Cape</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                Price Per Hour (ZAR) <span className="text-purple-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-zinc-500 font-bold">R</span>
                <input
                  type="number"
                  name="price_per_hour"
                  value={profileData.price_per_hour}
                  onChange={handleInputChange}
                  placeholder="800"
                  className="w-full bg-black border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                Experience (Years)
              </label>
              <input
                type="number"
                name="experience_years"
                value={profileData.experience_years}
                onChange={handleInputChange}
                placeholder="5"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={prevStep}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-xl transition"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!isStepValid()}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Music & Bio */}
        {currentStep === 3 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6">
            <div className="mb-4">
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                Bio
              </label>
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about your style, experience, and what makes you unique..."
                rows={4}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-zinc-400 text-sm mb-2 font-medium">
                Genres
              </label>
              <div className="flex flex-wrap gap-2">
                {genresList.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      profileData.genres.includes(genre)
                        ? "bg-purple-500 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-between gap-3">
              <button
                onClick={prevStep}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-xl transition"
              >
                Back
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Complete Setup
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && currentStep !== 3 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}