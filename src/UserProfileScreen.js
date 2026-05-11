import { useState, useEffect, useRef } from "react";
import { User, MapPin, Phone, Mail, Edit2, Check, Camera, ChevronDown, ChevronUp, LogOut, AlertCircle, Loader2, Headphones, Music, Mic } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "./UserContext/ThisUserContext";

export function UserProfileScreen() {
  const { user, logout, getToken } = useUser();
  const navigate = useNavigate();
  
  // UI States
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDJ, setIsDJ] = useState(false);
  const [djStatus, setDjStatus] = useState(null);
  const [djApplicationStatus, setDjApplicationStatus] = useState(null);
  const fileInputRef = useRef(null);
  
  // Form States
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    city: "",
    bio: "",
    profile_picture: null,
    username: ""
  });

  const BASE_API = 'https://gigza-testing-11.onrender.com/api';

  // Load profile on mount
  useEffect(() => {
    loadProfile();
    checkDJStatus();
  }, []);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const checkDJStatus = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Check if user has a DJ profile
      const djResponse = await fetch(`${BASE_API}/dj/my-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (djResponse.ok) {
        const djData = await djResponse.json();
        setIsDJ(true);
        setDjStatus(djData.dj_profile);
      }

      // Check DJ application status
      const appResponse = await fetch(`${BASE_API}/dj/application-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (appResponse.ok) {
        const appData = await appResponse.json();
        if (appData.application) {
          setDjApplicationStatus(appData.application.application_status);
        }
      }
    } catch (err) {
      console.error("Error checking DJ status:", err);
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${BASE_API}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const userData = data.data.user || {};
        const profileData = data.data.profile || {};
        
        setProfileData({
          full_name: profileData.full_name || userData.username || "",
          email: userData.email || "",
          phone_number: profileData.phone_number || "",
          city: profileData.city || "",
          bio: profileData.bio || "",
          profile_picture: profileData.profile_picture || null,
          username: userData.username || ""
        });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }
      
      const updateData = {
        full_name: profileData.full_name,
        phone_number: profileData.phone_number,
        city: profileData.city,
        bio: profileData.bio
      };

      if (profileData.profile_picture && typeof profileData.profile_picture === 'string') {
        updateData.profile_picture = profileData.profile_picture;
      }
      
      const response = await fetch(`${BASE_API}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setIsEditing(false);
        setSuccessMessage("Profile updated successfully!");
        await loadProfile();
      } else if (response.status === 401) {
        logout();
        navigate("/login");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
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
    reader.onloadend = async () => {
      const base64String = reader.result;
      setProfileData(prev => ({ ...prev, profile_picture: base64String }));
      
      try {
        const token = getToken();
        if (token) {
          const response = await fetch(`${BASE_API}/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ profile_picture: base64String })
          });
          
          if (response.ok) {
            setSuccessMessage("Profile picture updated successfully!");
          } else {
            throw new Error("Failed to save profile picture");
          }
        }
      } catch (err) {
        console.error("Error saving profile picture:", err);
        setError("Failed to save profile picture");
        setProfileData(prev => ({ ...prev, profile_picture: null }));
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    logout();
    navigate("/login");
  };

  const renderDJStatusBadge = () => {
    if (isDJ) {
      return (
        <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Headphones className="w-3 h-3" />
          Active DJ
        </div>
      );
    }
    
    if (djApplicationStatus === 'pending') {
      return (
        <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Music className="w-3 h-3" />
          DJ Application Pending
        </div>
      );
    }
    
    if (djApplicationStatus === 'rejected') {
      return (
        <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Mic className="w-3 h-3" />
          Application Rejected
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          {successMessage}
        </div>
      )}
      
      {/* Error Banner */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-white/70 hover:text-white">×</button>
        </div>
      )}
      
      {/* Header & Cover Photo */}
      <div className="h-48 bg-gradient-to-r from-purple-900 via-zinc-900 to-black relative">
        <div className="absolute -bottom-12 left-6 flex items-end gap-4">
          <div className="relative">
            <div className="w-24 h-24 bg-zinc-800 border-4 border-black rounded-full flex items-center justify-center overflow-hidden">
              {profileData.profile_picture ? (
                <img 
                  src={profileData.profile_picture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-zinc-500" />
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              disabled={uploadingImage}
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploadingImage}
              className="absolute bottom-0 right-0 bg-purple-500 p-1.5 rounded-full border-2 border-black text-white hover:bg-purple-600 transition disabled:opacity-50"
            >
              {uploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{profileData.full_name || profileData.username}</h1>
              {renderDJStatusBadge()}
            </div>
            <p className="text-zinc-400 text-sm">@{profileData.username}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-16 space-y-4">
        
        {/* Personal Information Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white">Personal Information</h2>
            {isEditing ? (
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="flex items-center gap-1 text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-green-500/20 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} 
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="flex items-center gap-1 text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-purple-500/20 transition"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-zinc-500 text-sm mb-1 block">Full Name</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={profileData.full_name} 
                  onChange={(e) => setProfileData({...profileData, full_name: e.target.value})} 
                  className="w-full bg-black border border-purple-500 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              ) : (
                <p className="text-white font-medium">{profileData.full_name || "Not set"}</p>
              )}
            </div>
            
            <div>
              <label className="text-zinc-500 text-sm mb-1 block flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email Address
              </label>
              <p className="text-white">{profileData.email}</p>
            </div>

            <div>
              <label className="text-zinc-500 text-sm mb-1 block flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone Number
              </label>
              {isEditing ? (
                <input 
                  type="tel" 
                  value={profileData.phone_number} 
                  onChange={(e) => setProfileData({...profileData, phone_number: e.target.value})} 
                  placeholder="+27 XX XXX XXXX"
                  className="w-full bg-black border border-purple-500 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              ) : (
                <p className="text-white">{profileData.phone_number || "Not set"}</p>
              )}
            </div>

            <div>
              <label className="text-zinc-500 text-sm mb-1 block flex items-center gap-1">
                <MapPin className="w-3 h-3" /> City
              </label>
              {isEditing ? (
                <select
                  value={profileData.city}
                  onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                  className="w-full bg-black border border-purple-500 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              ) : (
                <p className="text-white">{profileData.city || "Not set"}</p>
              )}
            </div>

            <div>
              <label className="text-zinc-500 text-sm mb-1 block">Bio</label>
              {isEditing ? (
                <textarea 
                  value={profileData.bio} 
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})} 
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full bg-black border border-purple-500 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              ) : (
                <p className="text-zinc-300">{profileData.bio || "No bio added yet"}</p>
              )}
            </div>
          </div>
        </div>

        {/* DJ Section - Conditional based on status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Headphones className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-white font-bold text-lg">DJ Status</h3>
            </div>
            
            {isDJ ? (
              /* User is already a DJ - Show DJ Dashboard link */
              <div className="space-y-3">
                <p className="text-zinc-400 text-sm">
                  You are an approved DJ on Gigza! You can manage your DJ profile, view booking requests, and track your earnings.
                </p>
                <Link 
                  to="/dashboard"
                  className="w-full flex items-center justify-between bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 p-3 rounded-xl hover:bg-purple-500/30 transition group"
                >
                  <div>
                    <p className="text-purple-400 font-semibold">Go to DJ Dashboard</p>
                    <p className="text-zinc-500 text-xs">Manage your gigs and availability</p>
                  </div>
                  <div className="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm group-hover:scale-105 transition">Go</div>
                </Link>
              </div>
            ) : djApplicationStatus === 'pending' ? (
              /* Application pending */
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                <Music className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-yellow-400 font-semibold">Application Under Review</p>
                <p className="text-zinc-400 text-sm mt-1">
                  Your DJ application is being reviewed by our team. You'll be notified once a decision is made.
                </p>
                <p className="text-zinc-500 text-xs mt-3">Status: Pending Review</p>
              </div>
            ) : djApplicationStatus === 'rejected' ? (
              /* Application rejected */
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <Mic className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 font-semibold">Application Not Approved</p>
                <p className="text-zinc-400 text-sm mt-1">
                  Your DJ application was not approved at this time. You can reapply after 30 days.
                </p>
                <button 
                  onClick={() => navigate("/apply-dj")}
                  className="mt-3 text-purple-400 text-sm hover:text-purple-300 transition"
                >
                  Reapply →
                </button>
              </div>
            ) : (
              /* No application - Show Apply button */
              <div className="space-y-3">
                <p className="text-zinc-400 text-sm">
                  Want to become a DJ on Gigza? Apply now to start your DJ career, get booked for events, and earn money.
                </p>
                <Link 
                  to="/apply-dj"
                  className="w-full flex items-center justify-between bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 p-3 rounded-xl hover:bg-purple-500/30 transition group"
                >
                  <div>
                    <p className="text-purple-400 font-semibold">Apply to Become a DJ</p>
                    <p className="text-zinc-500 text-xs">Fill out the application form</p>
                  </div>
                  <div className="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm group-hover:scale-105 transition">Apply</div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Account Settings Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <button 
            onClick={() => setExpandedSection(expandedSection === 'account' ? null : 'account')} 
            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800 transition"
          >
            <div className="flex items-center gap-3">
              <div className="bg-zinc-800 p-2 rounded-lg"><User className="w-5 h-5 text-zinc-300" /></div>
              <span className="text-white font-medium">Account Settings</span>
            </div>
            {expandedSection === 'account' ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
          </button>
          
          {expandedSection === 'account' && (
            <div className="bg-black/50 p-4 border-t border-zinc-800 space-y-3">
              <Link 
                to="/change-password"
                className="block w-full text-left text-zinc-300 hover:text-white py-2 px-3 rounded-lg hover:bg-zinc-800 transition"
              >
                Change Password
              </Link>
              <Link 
                to="/bookings"
                className="block w-full text-left text-zinc-300 hover:text-white py-2 px-3 rounded-lg hover:bg-zinc-800 transition"
              >
                My Bookings
              </Link>
              <Link 
                to="/emergency"
                className="block w-full text-left text-red-400 hover:text-red-300 py-2 px-3 rounded-lg hover:bg-red-500/10 transition"
              >
                Emergency SOS
              </Link>
              <hr className="border-zinc-800 my-2" />
              <button 
                onClick={handleLogout}
                className="block w-full text-left text-red-400 hover:text-red-300 py-2 px-3 rounded-lg hover:bg-red-500/10 transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}