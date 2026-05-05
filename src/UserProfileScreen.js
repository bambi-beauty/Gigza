import { useState, useEffect, useRef } from "react";
import { User, CreditCard, Bell, Shield, Edit2, Check, Camera, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "./UserContext/ThisUserContext";

export function UserProfileScreen() {
  const { user, logout, getToken } = useUser();
  const navigate = useNavigate();
  
  // UI States
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cardToRemove, setCardToRemove] = useState(null);
  const fileInputRef = useRef(null);
  
  // Form States
  const [newCard, setNewCard] = useState({ number: "", expiry: "", cvc: "" });
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    photo: null,
    prefs: {
      pushNotifications: true,
      emailAlerts: false,
      twoFactorAuth: false,
      privateProfile: false
    },
    paymentMethods: []
  });

  const BASE_API = 'http://localhost:5000/api';

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      console.log("Loading profile with token:", token ? "Token exists" : "No token");
      
      if (!token) {
        console.error("No token found, redirecting to login");
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

      console.log("Profile response status:", response.status);

      if (response.status === 401) {
        console.log("Token expired, logging out");
        logout();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Profile data received:", data);

      // Handle different response structures
      if (data.success && data.data) {
        setProfileData({
          name: data.data.user?.username || data.data.user?.name || "",
          email: data.data.user?.email || "",
          phone: data.data.user?.phone || "",
          photo: data.data.user?.avatar || data.data.user?.profilePicture || null,
          prefs: {
            pushNotifications: data.data.user?.push_notifications ?? true,
            emailAlerts: data.data.user?.email_alerts ?? false,
            twoFactorAuth: data.data.user?.two_factor_auth ?? false,
            privateProfile: data.data.user?.private_profile ?? false
          },
          paymentMethods: data.data.payment_methods || []
        });
      } else {
        // If API returns different structure, use mock data for testing
        console.warn("Unexpected API response structure, using fallback data");
        setProfileData({
          name: user?.username || "John Doe",
          email: user?.email || "john@example.com",
          phone: "+1 234 567 8900",
          photo: null,
          prefs: {
            pushNotifications: true,
            emailAlerts: false,
            twoFactorAuth: false,
            privateProfile: false
          },
          paymentMethods: [
            { id: "1", last4: "4242", expiry: "12/25", type: "Visa" },
            { id: "2", last4: "5555", expiry: "08/24", type: "Mastercard" }
          ]
        });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError(err.message);
      
      // Load mock data for testing UI
      console.log("Loading mock data for testing");
      setProfileData({
        name: "Test User",
        email: "test@example.com",
        phone: "+1 234 567 8900",
        photo: null,
        prefs: {
          pushNotifications: true,
          emailAlerts: false,
          twoFactorAuth: false,
          privateProfile: false
        },
        paymentMethods: [
          { id: "mock1", last4: "4242", expiry: "12/25", type: "Visa" },
          { id: "mock2", last4: "5555", expiry: "08/24", type: "Mastercard" }
        ]
      });
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
      
      const response = await fetch(`${BASE_API}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: profileData.name,
          phone: profileData.phone,
          push_notifications: profileData.prefs.pushNotifications,
          email_alerts: profileData.prefs.emailAlerts,
          two_factor_auth: profileData.prefs.twoFactorAuth,
          private_profile: profileData.prefs.privateProfile
        })
      });

      if (response.ok) {
        setIsEditing(false);
        setSuccessMessage("Profile updated successfully!");
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

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB");
      return;
    }

    // For testing, just set a local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData(prev => ({ ...prev, photo: reader.result }));
      setSuccessMessage("Profile picture updated!");
    };
    reader.readAsDataURL(file);
  };

  const toggleSetting = (settingKey) => {
    // Optimistically update UI
    const newValue = !profileData.prefs[settingKey];
    setProfileData(prev => ({
      ...prev,
      prefs: { ...prev.prefs, [settingKey]: newValue }
    }));
    
    // Save to backend (optional, can be done in background)
    const savePreference = async () => {
      try {
        const token = getToken();
        if (!token) return;

        await fetch(`${BASE_API}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            push_notifications: settingKey === 'pushNotifications' ? newValue : profileData.prefs.pushNotifications,
            email_alerts: settingKey === 'emailAlerts' ? newValue : profileData.prefs.emailAlerts,
            two_factor_auth: settingKey === 'twoFactorAuth' ? newValue : profileData.prefs.twoFactorAuth,
            private_profile: settingKey === 'privateProfile' ? newValue : profileData.prefs.privateProfile
          })
        });
        setSuccessMessage("Preference updated!");
      } catch (err) {
        console.error("Error saving preference:", err);
        // Revert on error
        setProfileData(prev => ({
          ...prev,
          prefs: { ...prev.prefs, [settingKey]: !newValue }
        }));
        setError("Failed to save preference");
      }
    };
    
    savePreference();
  };

  const handleAddCard = async () => {
    if (!newCard.number || newCard.number.length < 4) {
      setError("Please enter a valid card number");
      return;
    }
    
    try {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${BASE_API}/auth/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardNumber: newCard.number,
          expiry: newCard.expiry,
          cvc: newCard.cvc
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(prev => ({
          ...prev,
          paymentMethods: data.paymentMethods || [...prev.paymentMethods, {
            id: Date.now().toString(),
            last4: newCard.number.slice(-4),
            expiry: newCard.expiry,
            type: "Card"
          }]
        }));
        setNewCard({ number: "", expiry: "", cvc: "" });
        setShowAddCard(false);
        setSuccessMessage("Card added successfully!");
      } else {
        throw new Error("Failed to add card");
      }
    } catch (err) {
      console.error("Error adding card:", err);
      setError("Failed to add card. Please try again.");
    }
  };

  const confirmRemoveCard = (cardId) => {
    setCardToRemove(cardId);
    setShowConfirmDialog(true);
  };

  const handleRemoveCard = async () => {
    if (!cardToRemove) return;
    
    try {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${BASE_API}/auth/payment-methods/${cardToRemove}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        setProfileData(prev => ({
          ...prev,
          paymentMethods: prev.paymentMethods.filter(card => card.id !== cardToRemove)
        }));
        setSuccessMessage("Card removed successfully!");
      } else {
        throw new Error("Failed to remove card");
      }
    } catch (err) {
      console.error("Error removing card:", err);
      setError("Failed to remove card. Please try again.");
    } finally {
      setShowConfirmDialog(false);
      setCardToRemove(null);
    }
  };

  const ToggleSwitch = ({ isActive, onClick }) => (
    <button 
      onClick={onClick} 
      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isActive ? 'bg-purple-500' : 'bg-zinc-700'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${isActive ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );

  // Custom Confirm Dialog Component
  const ConfirmDialog = () => {
    if (!showConfirmDialog) return null;
    
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6">
          <h3 className="text-white text-lg font-bold mb-2">Confirm Removal</h3>
          <p className="text-zinc-400 mb-6">Are you sure you want to remove this payment method?</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowConfirmDialog(false);
                setCardToRemove(null);
              }}
              className="flex-1 bg-zinc-800 text-white py-2 rounded-xl hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveCard}
              className="flex-1 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 transition"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm sm:text-base whitespace-nowrap">
          {successMessage}
        </div>
      )}
      
      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 mb-4 mx-4 sm:mx-6 rounded-lg">
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="text-xs underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Header & Cover Photo */}
      <div className="h-48 bg-gradient-to-r from-purple-900 via-zinc-900 to-black relative">
        <div className="absolute -bottom-12 left-6 flex items-end gap-4">
          <div className="relative">
            <div className="w-24 h-24 bg-zinc-800 border-4 border-black rounded-full flex items-center justify-center overflow-hidden">
              {profileData.photo ? (
                <img src={profileData.photo} alt="Profile" className="w-full h-full object-cover" />
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
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="absolute bottom-0 right-0 bg-purple-500 p-1.5 rounded-full border-2 border-black text-white hover:bg-purple-600 transition"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-16 space-y-4 sm:space-y-8">
        
        {/* Personal Information Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white">Personal Info</h2>
            {isEditing ? (
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="flex items-center gap-1 text-green-400 bg-green-500/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-green-500/20 transition disabled:opacity-50"
              >
                {saving ? <div className="animate-spin rounded-full w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-green-400"></div> : <Check className="w-3 h-3 sm:w-4 sm:h-4" />} 
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="flex items-center gap-1 text-purple-400 bg-purple-500/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-purple-500/20 transition"
              >
                <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" /> Edit
              </button>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-zinc-500 text-xs sm:text-sm mb-1 block">Full Name</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={profileData.name} 
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                  className="w-full bg-black border border-purple-500 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              ) : (
                <p className="text-white font-medium text-base sm:text-lg">{profileData.name || "Not set"}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-zinc-500 text-xs sm:text-sm mb-1 block">Email Address</label>
                <p className="text-white text-sm sm:text-base break-all">{profileData.email}</p>
              </div>
              <div>
                <label className="text-zinc-500 text-xs sm:text-sm mb-1 block">Phone Number</label>
                {isEditing ? (
                  <input 
                    type="tel" 
                    value={profileData.phone} 
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                    className="w-full bg-black border border-purple-500 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500" 
                  />
                ) : (
                  <p className="text-white text-sm sm:text-base">{profileData.phone || "Not set"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Settings Menu */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden">
          
          {/* Payment Methods Setting */}
          <div>
            <button 
              onClick={() => setExpandedSection(expandedSection === 'payment' ? null : 'payment')} 
              className="w-full flex items-center justify-between p-4 border-b border-zinc-800 hover:bg-zinc-800 transition active:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 p-2 rounded-lg"><CreditCard className="w-5 h-5 text-zinc-300" /></div>
                <span className="text-white font-medium">Payment Methods</span>
              </div>
              {expandedSection === 'payment' ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
            </button>
            {expandedSection === 'payment' && (
              <div className="bg-black/50 p-4 border-b border-zinc-800 space-y-4">
                {profileData.paymentMethods.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-2">No payment methods saved.</p>
                ) : (
                  <div className="space-y-3">
                    {profileData.paymentMethods.map(card => (
                      <div key={card.id} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="bg-zinc-800 p-2 rounded text-zinc-300 font-bold text-xs shrink-0">{card.type || "Card"}</div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium break-all">•••• •••• •••• {card.last4}</p>
                            <p className="text-zinc-500 text-xs">Expires {card.expiry}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => confirmRemoveCard(card.id)} 
                          className="p-2 text-zinc-500 hover:text-red-500 transition shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {showAddCard ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mt-4 space-y-3">
                    <input 
                      type="text" 
                      placeholder="Card Number" 
                      value={newCard.number}
                      onChange={(e) => setNewCard({...newCard, number: e.target.value})}
                      className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    />
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        value={newCard.expiry}
                        onChange={(e) => setNewCard({...newCard, expiry: e.target.value})}
                        className="w-1/2 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                      />
                      <input 
                        type="password" 
                        placeholder="CVC" 
                        value={newCard.cvc}
                        onChange={(e) => setNewCard({...newCard, cvc: e.target.value})}
                        className="w-1/2 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => setShowAddCard(false)} 
                        className="flex-1 bg-zinc-800 text-white text-sm py-2 rounded-lg hover:bg-zinc-700 transition"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleAddCard} 
                        className="flex-1 bg-purple-500 text-white text-sm py-2 rounded-lg hover:bg-purple-600 transition"
                      >
                        Save Card
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowAddCard(true)} 
                    className="w-full flex items-center justify-center gap-2 mt-4 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 py-3 rounded-xl text-sm font-semibold transition"
                  >
                    <Plus className="w-4 h-4" /> Add Payment Method
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notifications Setting */}
          <div>
            <button 
              onClick={() => setExpandedSection(expandedSection === 'notifs' ? null : 'notifs')} 
              className="w-full flex items-center justify-between p-4 border-b border-zinc-800 hover:bg-zinc-800 transition active:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 p-2 rounded-lg"><Bell className="w-5 h-5 text-zinc-300" /></div>
                <span className="text-white font-medium">Notifications</span>
              </div>
              {expandedSection === 'notifs' ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
            </button>
            {expandedSection === 'notifs' && (
              <div className="bg-black/50 p-4 border-b border-zinc-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300 text-sm">Push Notifications</span>
                  <ToggleSwitch isActive={profileData.prefs.pushNotifications} onClick={() => toggleSetting('pushNotifications')} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300 text-sm">Email Alerts</span>
                  <ToggleSwitch isActive={profileData.prefs.emailAlerts} onClick={() => toggleSetting('emailAlerts')} />
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Security Setting */}
          <div>
            <button 
              onClick={() => setExpandedSection(expandedSection === 'privacy' ? null : 'privacy')} 
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-800 transition active:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 p-2 rounded-lg"><Shield className="w-5 h-5 text-zinc-300" /></div>
                <span className="text-white font-medium">Privacy & Security</span>
              </div>
              {expandedSection === 'privacy' ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
            </button>
            {expandedSection === 'privacy' && (
              <div className="bg-black/50 p-4 border-t border-zinc-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300 text-sm">Two-Factor Authentication</span>
                  <ToggleSwitch isActive={profileData.prefs.twoFactorAuth} onClick={() => toggleSetting('twoFactorAuth')} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300 text-sm">Private Account</span>
                  <ToggleSwitch isActive={profileData.prefs.privateProfile} onClick={() => toggleSetting('privateProfile')} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DJ Mode Toggle */}
        <div className="my-4 sm:my-6">
          <Link 
            to="/requests" 
            className="w-full flex items-center justify-between bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 p-4 rounded-2xl hover:bg-purple-500/30 transition group"
          >
            <div>
              <h3 className="text-purple-400 font-bold text-base sm:text-lg">Switch to DJ Dashboard</h3>
              <p className="text-zinc-400 text-xs sm:text-sm">Manage your gigs and availability</p>
            </div>
            <div className="bg-purple-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-semibold text-sm sm:text-base group-hover:scale-105 transition">Go</div>
          </Link>
        </div>

      </div>
      
      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
}