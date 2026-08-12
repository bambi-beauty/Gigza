import { useState, useEffect, useRef } from "react";
import { 
  User, Settings, LogOut, Globe, Moon, Sun, Monitor, 
  ChevronRight, Loader2, AlertCircle, Sparkles, Camera,
  Music, Smartphone, Info, CheckCircle, X, Mail, Phone,
  MapPin, Calendar, Edit2, Shield, Bell, Lock, Heart,
  Star, Download, Languages, CreditCard, Trash2, Clock,
  MessageCircle, Eye, Palette, Volume2, Headphones,
  Instagram, Twitter, Share2, Link, Globe as GlobeIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext/ThisUserContext";

export function UserProfileScreen() {
  const { user, logout, getToken } = useUser();
  const navigate = useNavigate();
  
  // ====== STATE MANAGEMENT ======
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  
  // Modal States
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  
  const fileInputRef = useRef(null);

  // Profile Data State
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    city: "",
    profile_picture: null,
    join_date: "",
    is_dj: false,
    bio: "",
    website: "",
    social_links: {
      instagram: "",
      twitter: "",
      soundcloud: ""
    }
  });

  // Settings State
  const [settings, setSettings] = useState({
    language: "en",
    theme: "dark",
    notifications: true,
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    two_factor: false,
    privacy: "public",
    show_online: true,
    allow_messages: true,
    timezone: "UTC",
    music_quality: "high",
    autoplay: true,
    download_quality: "high"
  });

  const [tempSettings, setTempSettings] = useState({ ...settings });

  const BASE_API = 'https://gigza-testing-11.onrender.com/api';

  // ====== LIFECYCLE ======
  useEffect(() => {
    loadProfile();
    loadSettings();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => clearSuccessMessage(), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ====== API FUNCTIONS ======
  const loadProfile = async () => {
    setLoading(true);
    clearError();
    
    try {
      const token = getToken();
      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(`${BASE_API}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          updateProfileData(data.data);
        }
      } else {
        throw new Error("Failed to load profile");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = (data) => {
    const userData = data.user || {};
    const profileData = data.profile || {};
    
    setProfile({
      full_name: profileData.full_name || userData.username || "",
      username: userData.username || "",
      email: userData.email || "",
      phone: profileData.phone_number || "",
      city: profileData.city || "",
      profile_picture: profileData.profile_picture || null,
      join_date: userData.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "January 2024",
      is_dj: userData.is_dj || false,
      bio: profileData.bio || "",
      website: profileData.website || "",
      social_links: {
        instagram: profileData.instagram || "",
        twitter: profileData.twitter || "",
        soundcloud: profileData.soundcloud || ""
      }
    });
  };

  const loadSettings = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${BASE_API}/auth/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(data.data);
          setTempSettings(data.data);
        }
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    clearError();

    try {
      const token = getToken();
      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(`${BASE_API}/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tempSettings)
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings({ ...tempSettings });
          showSuccessMessage("Settings updated successfully!");
          closeModal();
          return true;
        }
      }
      throw new Error("Failed to update settings");
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err.message || "Failed to update settings");
      return false;
    } finally {
      setSettingsSaving(false);
    }
  };

  const updateProfile = async (updatedData) => {
    clearError();
    
    try {
      const token = getToken();
      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(`${BASE_API}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData)
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(prev => ({ ...prev, ...updatedData }));
          showSuccessMessage("Profile updated successfully!");
          return true;
        }
      }
      throw new Error("Failed to update profile");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
      return false;
    }
  };

  // ====== MODAL FUNCTIONS ======
  const openModal = (modalName, data = null) => {
    setActiveModal(modalName);
    setModalData(data);
    resetSettings();
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
    resetSettings();
  };

  const resetSettings = () => {
    setTempSettings({ ...settings });
  };

  // ====== UTILITY FUNCTIONS ======
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
  };

  const clearSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const clearError = () => {
    setError(null);
  };

  const handleUnauthorized = () => {
    logout();
    navigate("/login");
  };

  const handleLogout = async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${BASE_API}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      logout();
      navigate("/login");
    }
  };

  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return profile.username?.slice(0, 2).toUpperCase() || 'U';
  };

  // ====== MODAL COMPONENTS ======

  // 1. USER INFORMATION MODAL
  const UserInfoModal = () => {
    const [editData, setEditData] = useState({
      full_name: profile.full_name,
      username: profile.username,
      email: profile.email,
      phone: profile.phone,
      city: profile.city,
      bio: profile.bio,
      website: profile.website
    });

    const handleSave = async () => {
      await updateProfile(editData);
      closeModal();
    };

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-zinc-800">
          <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">User Information</h2>
              <p className="text-zinc-400 text-sm">Edit your profile details</p>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Full Name</label>
              <input
                type="text"
                value={editData.full_name}
                onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Username</label>
              <input
                type="text"
                value={editData.username}
                onChange={(e) => setEditData({...editData, username: e.target.value})}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="Username"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Email</label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({...editData, email: e.target.value})}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="Email address"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Phone</label>
              <input
                type="tel"
                value={editData.phone}
                onChange={(e) => setEditData({...editData, phone: e.target.value})}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">City</label>
              <input
                type="text"
                value={editData.city}
                onChange={(e) => setEditData({...editData, city: e.target.value})}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="Your city"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Bio</label>
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData({...editData, bio: e.target.value})}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                rows="3"
                placeholder="Tell us about yourself"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Website</label>
              <input
                type="url"
                value={editData.website}
                onChange={(e) => setEditData({...editData, website: e.target.value})}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="Your website URL"
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 p-4 flex gap-3">
            <button
              onClick={closeModal}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-white hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 2. SYSTEM SETTINGS MODAL
  const SystemSettingsModal = () => {
    const [localSettings, setLocalSettings] = useState({ ...tempSettings });

    const handleToggle = (key) => {
      setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
      setTempSettings(localSettings);
      await saveSettings();
    };

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-zinc-800">
          <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">System Settings</h2>
              <p className="text-zinc-400 text-sm">Configure your app preferences</p>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Timezone */}
            <div>
              <label className="text-zinc-400 text-sm block mb-2">Timezone</label>
              <select
                value={localSettings.timezone}
                onChange={(e) => setLocalSettings({...localSettings, timezone: e.target.value})}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">New York</option>
                <option value="America/Los_Angeles">Los Angeles</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Dubai">Dubai</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>

            {/* Music Quality */}
            <div>
              <label className="text-zinc-400 text-sm block mb-2">Music Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map((quality) => (
                  <button
                    key={quality}
                    onClick={() => setLocalSettings({...localSettings, music_quality: quality})}
                    className={`p-3 rounded-xl border-2 transition-all capitalize ${
                      localSettings.music_quality === quality 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-white text-sm">{quality}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Download Quality */}
            <div>
              <label className="text-zinc-400 text-sm block mb-2">Download Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {['standard', 'high', 'lossless'].map((quality) => (
                  <button
                    key={quality}
                    onClick={() => setLocalSettings({...localSettings, download_quality: quality})}
                    className={`p-3 rounded-xl border-2 transition-all capitalize ${
                      localSettings.download_quality === quality 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-white text-sm">{quality}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Autoplay */}
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-white block">Autoplay</span>
                  <span className="text-zinc-500 text-xs">Auto-play next track</span>
                </div>
                <button
                  onClick={() => handleToggle('autoplay')}
                  className={`w-12 h-7 rounded-full transition-all ${
                    localSettings.autoplay ? 'bg-purple-500' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                    localSettings.autoplay ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>

            {/* Show Online Status */}
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-white block">Show Online Status</span>
                  <span className="text-zinc-500 text-xs">Let others see when you're online</span>
                </div>
                <button
                  onClick={() => handleToggle('show_online')}
                  className={`w-12 h-7 rounded-full transition-all ${
                    localSettings.show_online ? 'bg-purple-500' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                    localSettings.show_online ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>

            {/* Allow Messages */}
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-white block">Allow Messages</span>
                  <span className="text-zinc-500 text-xs">Let others message you</span>
                </div>
                <button
                  onClick={() => handleToggle('allow_messages')}
                  className={`w-12 h-7 rounded-full transition-all ${
                    localSettings.allow_messages ? 'bg-purple-500' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                    localSettings.allow_messages ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>
          </div>

          <div className="sticky bottom-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 p-4 flex gap-3">
            <button
              onClick={closeModal}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-white hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={settingsSaving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50"
            >
              {settingsSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 3. LANGUAGE MODAL
  const LanguageModal = () => {
    const languages = [
      { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
      { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
      { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
      { code: 'de', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
      { code: 'zh', name: 'Chinese', flag: '🇨🇳', native: '中文' },
      { code: 'ja', name: 'Japanese', flag: '🇯🇵', native: '日本語' },
      { code: 'ko', name: 'Korean', flag: '🇰🇷', native: '한국어' },
      { code: 'ar', name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
      { code: 'pt', name: 'Portuguese', flag: '🇵🇹', native: 'Português' },
      { code: 'it', name: 'Italian', flag: '🇮🇹', native: 'Italiano' },
      { code: 'ru', name: 'Russian', flag: '🇷🇺', native: 'Русский' },
      { code: 'hi', name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' }
    ];

    const handleSelect = async (code) => {
      setTempSettings({...tempSettings, language: code});
      await saveSettings();
    };

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-md border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Select Language</h2>
              <p className="text-zinc-400 text-sm">Choose your preferred language</p>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-2 max-h-96 overflow-y-auto">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  settings.language === lang.code 
                    ? 'bg-purple-500/20 border border-purple-500' 
                    : 'hover:bg-white/5'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <span className="text-white block">{lang.name}</span>
                  <span className="text-zinc-500 text-xs">{lang.native}</span>
                </div>
                {settings.language === lang.code && (
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 4. THEME MODAL
  const ThemeModal = () => {
    const themes = [
      { id: 'dark', icon: <Moon className="w-8 h-8" />, label: 'Dark', description: 'Easy on the eyes' },
      { id: 'light', icon: <Sun className="w-8 h-8" />, label: 'Light', description: 'Bright and clean' },
      { id: 'system', icon: <Monitor className="w-8 h-8" />, label: 'System', description: 'Follow your device' },
    ];

    const handleSelect = async (theme) => {
      setTempSettings({...tempSettings, theme});
      await saveSettings();
    };

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-md border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Choose Theme</h2>
              <p className="text-zinc-400 text-sm">Customize your app appearance</p>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  settings.theme === theme.id 
                    ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20' 
                    : 'border-zinc-700 hover:border-zinc-600 hover:bg-white/5'
                }`}
              >
                <div className={`p-3 rounded-xl transition-all ${
                  settings.theme === theme.id ? 'bg-purple-500/30' : 'bg-zinc-800'
                }`}>
                  <div className={settings.theme === theme.id ? 'text-purple-400' : 'text-zinc-400'}>
                    {theme.icon}
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <span className="text-white block font-medium">{theme.label}</span>
                  <span className="text-zinc-500 text-xs">{theme.description}</span>
                </div>
                {settings.theme === theme.id && (
                  <CheckCircle className="w-6 h-6 text-purple-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 5. NOTIFICATIONS MODAL
  const NotificationsModal = () => {
    const [localSettings, setLocalSettings] = useState({ ...tempSettings });

    const handleToggle = (key) => {
      setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
      setTempSettings(localSettings);
      await saveSettings();
    };

    const notificationTypes = [
      { key: 'push_notifications', icon: Bell, label: 'Push Notifications', description: 'Receive push notifications' },
      { key: 'email_notifications', icon: Mail, label: 'Email Notifications', description: 'Receive email updates' },
      { key: 'sms_notifications', icon: MessageCircle, label: 'SMS Notifications', description: 'Receive SMS alerts' },
      { key: 'notifications', icon: Bell, label: 'General Notifications', description: 'All other notifications' }
    ];

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-md border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Notifications</h2>
              <p className="text-zinc-400 text-sm">Manage your notification preferences</p>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {notificationTypes.map(({ key, icon: Icon, label, description }) => (
              <div key={key} className="p-4 bg-black/30 rounded-xl border border-zinc-800">
                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Icon className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <span className="text-white block text-sm font-medium">{label}</span>
                      <span className="text-zinc-500 text-xs">{description}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(key)}
                    className={`w-12 h-7 rounded-full transition-all flex-shrink-0 ${
                      localSettings[key] ? 'bg-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                      localSettings[key] ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </label>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-zinc-800 flex gap-3">
            <button
              onClick={closeModal}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-white hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 6. PRIVACY MODAL
  const PrivacyModal = () => {
    const [localSettings, setLocalSettings] = useState({ ...tempSettings });

    const handleSave = async () => {
      setTempSettings(localSettings);
      await saveSettings();
    };

    const privacyLevels = [
      { value: 'public', label: 'Public', description: 'Everyone can see your profile' },
      { value: 'friends', label: 'Friends Only', description: 'Only friends can see your profile' },
      { value: 'private', label: 'Private', description: 'Only you can see your profile' }
    ];

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-md border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Privacy Settings</h2>
              <p className="text-zinc-400 text-sm">Control your privacy preferences</p>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-4 space-y-6">
            <div>
              <label className="text-zinc-400 text-sm block mb-3">Profile Privacy</label>
              <div className="space-y-2">
                {privacyLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setLocalSettings({...localSettings, privacy: level.value})}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      localSettings.privacy === level.value 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-white block font-medium">{level.label}</span>
                    <span className="text-zinc-500 text-xs">{level.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-white block">Show Online Status</span>
                  <span className="text-zinc-500 text-xs">Let others see when you're online</span>
                </div>
                <button
                  onClick={() => setLocalSettings({...localSettings, show_online: !localSettings.show_online})}
                  className={`w-12 h-7 rounded-full transition-all ${
                    localSettings.show_online ? 'bg-purple-500' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                    localSettings.show_online ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-white block">Allow Messages</span>
                  <span className="text-zinc-500 text-xs">Let others send you messages</span>
                </div>
                <button
                  onClick={() => setLocalSettings({...localSettings, allow_messages: !localSettings.allow_messages})}
                  className={`w-12 h-7 rounded-full transition-all ${
                    localSettings.allow_messages ? 'bg-purple-500' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                    localSettings.allow_messages ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>
          </div>
          <div className="p-4 border-t border-zinc-800 flex gap-3">
            <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-white hover:bg-white/5 transition">
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition">
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 7. TWO-FACTOR AUTH MODAL
  const TwoFactorModal = () => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [setupData, setSetupData] = useState(null);

    const handleSetup = async () => {
      setIsLoading(true);
      try {
        const token = getToken();
        const response = await fetch(`${BASE_API}/auth/2fa/setup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSetupData(data);
          showSuccessMessage("2FA setup initiated!");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to setup 2FA");
      } finally {
        setIsLoading(false);
      }
    };

    const handleVerify = async () => {
      setIsLoading(true);
      try {
        const token = getToken();
        const response = await fetch(`${BASE_API}/auth/2fa/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            showSuccessMessage("2FA verified successfully!");
            setTempSettings({...tempSettings, two_factor: true});
            await saveSettings();
            closeModal();
          }
        }
      } catch (err) {
        console.error(err);
        setError("Invalid verification code");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-md border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Two-Factor Authentication</h2>
              <p className="text-zinc-400 text-sm">Add extra security to your account</p>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <p className="text-purple-300 text-sm">
                Two-factor authentication adds an extra layer of security to your account.
                You'll need to enter a verification code from your authenticator app when logging in.
              </p>
            </div>

            {!setupData ? (
              <button
                onClick={handleSetup}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50"
              >
                {isLoading ? 'Setting up...' : 'Setup Two-Factor Auth'}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-black/50 p-4 rounded-xl text-center">
                  <p className="text-zinc-400 text-sm mb-2">Scan this QR code with your authenticator app</p>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img src={setupData.qr_code} alt="QR Code" className="w-32 h-32" />
                  </div>
                  <p className="text-zinc-500 text-xs mt-2">Or enter this code manually: {setupData.secret}</p>
                </div>

                <div>
                  <label className="text-zinc-400 text-sm block mb-1.5">Enter Verification Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest focus:outline-none focus:border-purple-500"
                    maxLength="6"
                  />
                </div>

                <button
                  onClick={handleVerify}
                  disabled={isLoading || code.length < 6}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 8. FAVORITES MODAL
  const FavoritesModal = () => {
    const [favorites, setFavorites] = useState([
      { id: 1, title: 'Summer Vibes Mix', artist: 'DJ Cool', duration: '3:45', plays: '12.5K' },
      { id: 2, title: 'Midnight Beats', artist: 'DJ Shadow', duration: '4:20', plays: '8.7K' },
      { id: 3, title: 'Sunset Grooves', artist: 'DJ Sunshine', duration: '5:10', plays: '15.2K' },
    ]);

    const handleRemoveFavorite = (id) => {
      setFavorites(favorites.filter(f => f.id !== id));
      showSuccessMessage("Removed from favorites!");
    };

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Favorites</h2>
              <p className="text-zinc-400 text-sm">Your saved tracks and mixes</p>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-2 overflow-y-auto max-h-96">
            {favorites.length > 0 ? (
              favorites.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition group">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <p className="text-zinc-400 text-xs">{item.artist}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-zinc-500 text-xs">{item.duration}</span>
                      <span className="text-zinc-600 text-xs">•</span>
                      <span className="text-zinc-500 text-xs">{item.plays} plays</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFavorite(item.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No favorites yet</p>
                <p className="text-zinc-600 text-xs">Start saving your favorite tracks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 9. DOWNLOADS MODAL
  const DownloadsModal = () => {
    const [downloads, setDownloads] = useState([
      { id: 1, title: 'Summer Vibes Mix', size: '45.2 MB', status: 'Completed', date: '2024-01-15' },
      { id: 2, title: 'Midnight Beats', size: '32.8 MB', status: 'Completed', date: '2024-01-14' },
      { id: 3, title: 'Sunset Grooves', size: '58.1 MB', status: 'Downloading', progress: 67 },
    ]);

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Downloads</h2>
              <p className="text-zinc-400 text-sm">Your downloaded content</p>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-2 overflow-y-auto max-h-96">
            {downloads.map((item) => (
              <div key={item.id} className="p-3 hover:bg-white/5 rounded-xl transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-zinc-500 text-xs">{item.size}</span>
                      <span className="text-zinc-600 text-xs">•</span>
                      <span className="text-zinc-500 text-xs">{item.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {item.status === 'Downloading' ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        <span className="text-purple-400 text-xs">{item.progress}%</span>
                      </div>
                    ) : (
                      <span className="text-green-400 text-xs">{item.status}</span>
                    )}
                  </div>
                </div>
                {item.status === 'Downloading' && (
                  <div className="w-full h-1 bg-zinc-700 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 10. DJ APPLICATION MODAL
  const DJApplicationModal = () => {
    const [application, setApplication] = useState({
      experience: '',
      genres: [],
      equipment: '',
      social_links: '',
      bio: '',
      sample_url: ''
    });

    const [selectedGenres, setSelectedGenres] = useState([]);
    const genres = ['House', 'Techno', 'Trance', 'Dubstep', 'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Jazz', 'Classical'];

    const handleSubmit = async () => {
      try {
        const token = getToken();
        const response = await fetch(`${BASE_API}/dj/apply`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...application,
            genres: selectedGenres
          })
        });
        if (response.ok) {
          showSuccessMessage("DJ application submitted successfully!");
          closeModal();
        }
      } catch (err) {
        console.error(err);
        setError("Failed to submit application");
      }
    };

    const toggleGenre = (genre) => {
      setSelectedGenres(prev => 
        prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
      );
    };

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-zinc-800">
          <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">DJ Application</h2>
              <p className="text-zinc-400 text-sm">Apply to become a DJ</p>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Experience (years)</label>
              <input
                type="number"
                value={application.experience}
                onChange={(e) => setApplication({...application, experience: e.target.value})}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="Years of experience"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Genres</label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      selectedGenres.includes(genre) 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Equipment</label>
              <input
                type="text"
                value={application.equipment}
                onChange={(e) => setApplication({...application, equipment: e.target.value})}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="Your equipment setup"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Bio</label>
              <textarea
                value={application.bio}
                onChange={(e) => setApplication({...application, bio: e.target.value})}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                rows="3"
                placeholder="Tell us about yourself as a DJ"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Sample Track URL</label>
              <input
                type="url"
                value={application.sample_url}
                onChange={(e) => setApplication({...application, sample_url: e.target.value})}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="Link to your best mix"
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 p-4 flex gap-3">
            <button
              onClick={closeModal}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-white hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition"
            >
              Submit Application
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 11. APP INFO MODAL
  const AppInfoModal = () => {
    const appInfo = {
      version: '2.3.0',
      build: '2024.01.15',
      developer: 'Gigza Team',
      website: 'https://gigza.com',
      email: 'support@gigza.com',
      features: [
        'High-quality audio streaming',
        'Offline downloads',
        'DJ application system',
        'Social sharing',
        'Personalized recommendations',
        'Real-time notifications',
        'Multi-language support',
        'Dark/Light theme'
      ]
    };

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-md border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">App Info</h2>
              <p className="text-zinc-400 text-sm">About Gigza</p>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <Music className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Gigza</h3>
              <p className="text-zinc-400 text-sm">Version {appInfo.version}</p>
              <p className="text-zinc-500 text-xs">Build {appInfo.build}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-sm">Developer</span>
                <span className="text-white text-sm">{appInfo.developer}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-sm">Website</span>
                <a href={appInfo.website} className="text-purple-400 text-sm hover:underline">{appInfo.website}</a>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-400 text-sm">Email</span>
                <a href={`mailto:${appInfo.email}`} className="text-purple-400 text-sm hover:underline">{appInfo.email}</a>
              </div>
            </div>

            <div>
              <h4 className="text-zinc-400 text-sm font-medium mb-2">Features</h4>
              <div className="grid grid-cols-2 gap-2">
                {appInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-3 h-3 text-purple-400" />
                    <span className="text-zinc-300 text-xs">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 12. CLEAR CACHE CONFIRMATION MODAL
  const ClearCacheModal = () => {
    const [isClearing, setIsClearing] = useState(false);

    const handleClear = async () => {
      setIsClearing(true);
      try {
        if ('caches' in window) {
          await caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
          showSuccessMessage("Cache cleared successfully!");
          closeModal();
        }
      } catch (err) {
        console.error(err);
        setError("Failed to clear cache");
      } finally {
        setIsClearing(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-sm border border-zinc-800">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Clear Cache?</h3>
            <p className="text-zinc-400 text-sm mb-6">
              This will clear all cached data from the app. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-white hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                disabled={isClearing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition disabled:opacity-50"
              >
                {isClearing ? 'Clearing...' : 'Clear Cache'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 13. CLEAR HISTORY CONFIRMATION MODAL
  const ClearHistoryModal = () => {
    const [isClearing, setIsClearing] = useState(false);

    const handleClear = async () => {
      setIsClearing(true);
      try {
        localStorage.removeItem('searchHistory');
        sessionStorage.removeItem('searchHistory');
        showSuccessMessage("History cleared successfully!");
        closeModal();
      } catch (err) {
        console.error(err);
        setError("Failed to clear history");
      } finally {
        setIsClearing(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-sm border border-zinc-800">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Clear History?</h3>
            <p className="text-zinc-400 text-sm mb-6">
              This will clear your search and listening history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-white hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                disabled={isClearing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition disabled:opacity-50"
              >
                {isClearing ? 'Clearing...' : 'Clear History'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 14. LOGOUT CONFIRMATION MODAL
  const LogoutModal = () => {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogoutConfirm = async () => {
      setIsLoggingOut(true);
      try {
        const token = getToken();
        if (token) {
          await fetch(`${BASE_API}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        logout();
        navigate("/login");
        closeModal();
      }
    };

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-zinc-900 rounded-3xl w-full max-w-sm border border-zinc-800">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <LogOut className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Log Out?</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-white hover:bg-white/5 transition"
              >
                Stay
              </button>
              <button
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition disabled:opacity-50"
              >
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ====== MAIN RENDER ======
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* ====== MODALS ====== */}
      {activeModal === 'user-info' && <UserInfoModal />}
      {activeModal === 'settings' && <SystemSettingsModal />}
      {activeModal === 'language' && <LanguageModal />}
      {activeModal === 'theme' && <ThemeModal />}
      {activeModal === 'notifications' && <NotificationsModal />}
      {activeModal === 'privacy' && <PrivacyModal />}
      {activeModal === 'two-factor' && <TwoFactorModal />}
      {activeModal === 'favorites' && <FavoritesModal />}
      {activeModal === 'downloads' && <DownloadsModal />}
      {activeModal === 'dj-application' && <DJApplicationModal />}
      {activeModal === 'app-info' && <AppInfoModal />}
      {activeModal === 'clear-cache' && <ClearCacheModal />}
      {activeModal === 'clear-history' && <ClearHistoryModal />}
      {activeModal === 'logout' && <LogoutModal />}

      {/* ====== TOASTS ====== */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500/90 backdrop-blur-xl text-white px-6 py-3 rounded-2xl shadow-2xl shadow-green-500/20 z-50 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle className="w-4 h-4" />
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur-xl text-white px-6 py-3 rounded-2xl shadow-2xl shadow-red-500/20 z-50 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={clearError} className="ml-2">✕</button>
        </div>
      )}

      {/* ====== HEADER ====== */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 px-6 pt-12 pb-8">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-black/30 border-2 border-white/20 overflow-hidden flex items-center justify-center">
              {profile.profile_picture ? (
                <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white/60">{getInitials()}</span>
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
            />
            <button 
              className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-500 to-blue-500 p-1.5 rounded-full border-2 border-black text-white hover:scale-110 transition"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold">{profile.full_name}</h2>
            <p className="text-purple-200/80 text-sm">@{profile.username}</p>
            {profile.is_dj && (
              <span className="inline-flex items-center gap-1 bg-purple-500/30 px-2 py-0.5 rounded-full text-xs text-purple-200 mt-1">
                <Music className="w-3 h-3" />
                DJ
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">12</p>
            <p className="text-purple-200/70 text-xs">Gigs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">4.8</p>
            <p className="text-purple-200/70 text-xs">Rating</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">245</p>
            <p className="text-purple-200/70 text-xs">Followers</p>
          </div>
        </div>
      </div>

      {/* ====== MAIN MENU ====== */}
      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-4">
        {/* Account Section */}
        <div>
          <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider px-2 mb-2">Account</h3>
          
          <button 
            onClick={() => openModal('user-info')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <User className="w-4 h-4 text-purple-400" />
            </div>
            <span className="flex-1 text-left text-sm">User Information</span>
            <div className="text-zinc-500 text-xs truncate max-w-[120px]">
              {profile.email}
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>

          <button 
            onClick={() => openModal('favorites')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-red-500/20 rounded-xl">
              <Heart className="w-4 h-4 text-red-400" />
            </div>
            <span className="flex-1 text-left text-sm">Favorites</span>
            <span className="text-zinc-500 text-xs">12 tracks</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>

          <button 
            onClick={() => openModal('downloads')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Download className="w-4 h-4 text-blue-400" />
            </div>
            <span className="flex-1 text-left text-sm">Downloads</span>
            <span className="text-zinc-500 text-xs">8 items</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
        </div>

        {/* Preferences Section */}
        <div>
          <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider px-2 mb-2">Preferences</h3>
          
          <button 
            onClick={() => openModal('settings')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Settings className="w-4 h-4 text-blue-400" />
            </div>
            <span className="flex-1 text-left text-sm">System Settings</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>

          <button 
            onClick={() => openModal('language')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-green-500/20 rounded-xl">
              <Globe className="w-4 h-4 text-green-400" />
            </div>
            <span className="flex-1 text-left text-sm">Language</span>
            <span className="text-zinc-500 text-xs uppercase">{settings.language}</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>

          <button 
            onClick={() => openModal('theme')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-yellow-500/20 rounded-xl">
              {settings.theme === 'dark' ? (
                <Moon className="w-4 h-4 text-yellow-400" />
              ) : settings.theme === 'light' ? (
                <Sun className="w-4 h-4 text-yellow-400" />
              ) : (
                <Monitor className="w-4 h-4 text-yellow-400" />
              )}
            </div>
            <span className="flex-1 text-left text-sm">Theme</span>
            <span className="text-zinc-500 text-xs capitalize">{settings.theme}</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>

          <button 
            onClick={() => openModal('notifications')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Bell className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="flex-1 text-left text-sm">Notifications</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>

          <button 
            onClick={() => openModal('privacy')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
            <span className="flex-1 text-left text-sm">Privacy</span>
            <span className="text-zinc-500 text-xs capitalize">{settings.privacy}</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>

          <button 
            onClick={() => openModal('two-factor')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-red-500/20 rounded-xl">
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <span className="flex-1 text-left text-sm">Two-Factor Auth</span>
            <span className={`text-xs ${settings.two_factor ? 'text-green-400' : 'text-zinc-500'}`}>
              {settings.two_factor ? 'Enabled' : 'Disabled'}
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
        </div>

        {/* App Section */}
        <div>
          <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider px-2 mb-2">App</h3>
          
          <button 
            onClick={() => openModal('dj-application')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-pink-500/20 rounded-xl">
              <Music className="w-4 h-4 text-pink-400" />
            </div>
            <span className="flex-1 text-left text-sm">DJ Application</span>
            {profile.is_dj ? (
              <span className="text-green-400 text-xs font-medium">Active</span>
            ) : (
              <span className="text-zinc-500 text-xs">Apply</span>
            )}
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>

          <button 
            onClick={() => openModal('app-info')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Info className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="flex-1 text-left text-sm">App Info</span>
            <span className="text-zinc-500 text-xs">v2.3.0</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>

          <button 
            onClick={() => openModal('clear-cache')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-orange-500/20 rounded-xl">
              <Trash2 className="w-4 h-4 text-orange-400" />
            </div>
            <span className="flex-1 text-left text-sm">Clear Cache</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>

          <button 
            onClick={() => openModal('clear-history')}
            className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="p-2 bg-pink-500/20 rounded-xl">
              <Clock className="w-4 h-4 text-pink-400" />
            </div>
            <span className="flex-1 text-left text-sm">Clear History</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
        </div>

        {/* Logout */}
        <button 
          onClick={() => openModal('logout')}
          className="w-full flex items-center gap-4 py-3 px-2 hover:bg-red-500/10 rounded-xl transition group mt-4 border-t border-zinc-800/50 pt-4"
        >
          <div className="p-2 bg-red-500/20 rounded-xl">
            <LogOut className="w-4 h-4 text-red-400" />
          </div>
          <span className="flex-1 text-left text-sm text-red-400">Log Out</span>
          <ChevronRight className="w-4 h-4 text-red-500/50 group-hover:text-red-400 transition" />
        </button>
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-zinc-600 text-xs">Gigza v2.3.0</p>
        <p className="text-zinc-700 text-xs mt-1">Member since {profile.join_date}</p>
      </div>
    </div>
  );
}