// ProfileSetupScreen.js - Updated with profile picture support
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, MapPin, Camera, ArrowRight, Loader2, Sparkles, Music, SkipForward } from "lucide-react";
import { useUser } from "./UserContext/ThisUserContext";

export function ProfileSetupScreen({ onComplete, onSkip }) {
  const navigate = useNavigate();
  const { user, getToken } = useUser();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    phone_number: "",
    city: "",
    bio: "",
    profile_picture: null
  });
  
  const [currentStep, setCurrentStep] = useState(1);

  const BASE_API = process.env.REACT_APP_API_URL || 'https://gigza-testing-11.onrender.com/api';

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        full_name: user.full_name || user.username || "",
        phone_number: user.phone_number || "",
        city: user.city || "",
        bio: user.bio || ""
      }));
    }
  }, [user]);

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      navigate("/", { replace: true });
    }
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

    setUploadingImage(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData(prev => ({ ...prev, profile_picture: reader.result }));
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const updateData = {};
      if (profileData.full_name) updateData.full_name = profileData.full_name;
      if (profileData.phone_number) updateData.phone_number = profileData.phone_number;
      if (profileData.city) updateData.city = profileData.city;
      if (profileData.bio) updateData.bio = profileData.bio;
      if (profileData.profile_picture) updateData.profile_picture = profileData.profile_picture;
      
      if (Object.keys(updateData).length > 0) {
        const response = await fetch(`${BASE_API}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
          throw new Error("Failed to save profile");
        }
      }
      
      localStorage.removeItem("needsProfileSetup");
      
      if (onComplete) {
        onComplete();
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Profile setup error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isValidStep = () => {
    if (currentStep === 1) {
      return profileData.full_name.trim().length > 0;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/25">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Complete Your Profile</h1>
          <p className="text-zinc-400 text-sm mt-1">Tell us a bit about yourself</p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex-1 mx-1">
              <div className={`h-1 rounded-full transition-all duration-300 ${currentStep >= step ? 'bg-purple-500' : 'bg-zinc-800'}`} />
            </div>
          ))}
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8 text-xs text-zinc-500">
          <span className={currentStep === 1 ? "text-purple-400" : ""}>Basic Info</span>
          <span className={currentStep === 2 ? "text-purple-400" : ""}>Location</span>
          <span className={currentStep === 3 ? "text-purple-400" : ""}>About You</span>
        </div>

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 mb-6">
              {/* Avatar Upload */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                    {profileData.profile_picture ? (
                      <img src={profileData.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden" 
                    id="avatar-upload"
                    disabled={uploadingImage}
                  />
                  <label 
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-purple-500 p-1.5 rounded-full border-2 border-black cursor-pointer hover:bg-purple-600 transition"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3 text-white" />
                    )}
                  </label>
                </div>
              </div>

              {/* Full Name */}
              <div className="mb-4">
                <label className="block text-zinc-400 text-sm mb-2 font-medium">
                  What should we call you? <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="e.g., John Doe"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  autoFocus
                />
                <p className="text-zinc-500 text-xs mt-1">This is how other users will see you</p>
              </div>

              {/* Phone Number */}
              <div className="mb-4">
                <label className="block text-zinc-400 text-sm mb-2 font-medium">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel"
                    value={profileData.phone_number}
                    onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                    placeholder="+27 XX XXX XXXX"
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
              <button
                onClick={nextStep}
                disabled={!isValidStep()}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 text-purple-400 mb-4">
                <MapPin className="w-5 h-5" />
                <span className="text-sm font-medium">Where are you located?</span>
              </div>

              <div className="mb-4">
                <label className="block text-zinc-400 text-sm mb-2 font-medium">City <span className="text-xs text-zinc-500">(Optional)</span></label>
                <select
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                >
                  <option value="">Select your city</option>
                  <option value="Cape Town">Cape Town</option>
                  <option value="Johannesburg">Johannesburg</option>
                  <option value="Pretoria">Pretoria</option>
                  <option value="Durban">Durban</option>
                  <option value="Port Elizabeth">Port Elizabeth</option>
                  <option value="Bloemfontein">Bloemfontein</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <p className="text-zinc-300 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  Your location helps us find DJs near you for events
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={prevStep}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: About You */}
        {currentStep === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 text-purple-400 mb-4">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium">Tell us about yourself</span>
              </div>

              <div className="mb-4">
                <label className="block text-zinc-400 text-sm mb-2 font-medium">Bio (Optional)</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="I love music, events, and creating unforgettable experiences..."
                  rows={4}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                />
                <p className="text-zinc-500 text-xs mt-1">Share your interests or what kind of events you love</p>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={prevStep}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? "Saving..." : "Complete Setup"}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}