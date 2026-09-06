// UserProfileScreen.js - COMPLETE FIXED VERSION with

import { useState, useEffect, useRef } from "react";
import { 
  User, Settings, LogOut, Globe, Moon, Sun, Monitor, 
  ChevronRight, Loader2, AlertCircle, Sparkles, Camera,
  Music, Smartphone, Info, CheckCircle, X, Mail, Phone,
  MapPin, Calendar, Edit2, Shield, Bell, Lock, Heart,
  Star, Download, Languages, CreditCard, Trash2, Clock,
  MessageCircle, Eye, Palette, Volume2, Headphones, HelpCircle,
  Instagram, Twitter, Share2, Link, Globe as GlobeIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext/ThisUserContext";

// ✅ FIXED: Correct import paths for services
import { getUserBookings, createBooking, cancelBooking, updateBookingStatus } from "./services/bookingService";

// ============================================
// ALL MODAL COMPONENTS
// ============================================

// 1. USER INFORMATION MODAL
const UserInfoModal = ({ profile, onUpdate, onClose }) => {
  const [editData, setEditData] = useState({
    full_name: profile.full_name || "",
    username: profile.username || "",
    email: profile.email || "",
    phone: profile.phone || "",
    city: profile.city || "",
    bio: profile.bio || "",
    website: profile.website || ""
  });

  const handleSave = async () => {
    await onUpdate(editData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/[0.08]">
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">User Information</h2>
            <p className="text-zinc-400 text-sm">Edit your profile details</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105">
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
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200">Cancel</button>
          <button onClick={handleSave} className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-200">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

// 2. SYSTEM SETTINGS MODAL
const SystemSettingsModal = ({ settings, tempSettings, setTempSettings, onSave, onClose, isSaving }) => {
  const handleToggle = (key) => {
    setTempSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/[0.08]">
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800 p-4 flex items-center justify-between">
          <div><h2 className="text-xl font-bold text-white">System Settings</h2><p className="text-zinc-400 text-sm">Configure your app preferences</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-4 space-y-6">
          <div>
            <label className="text-zinc-400 text-sm block mb-2">Timezone</label>
            <select value={tempSettings.timezone} onChange={(e) => setTempSettings({...tempSettings, timezone: e.target.value})} className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
              <option value="UTC">UTC</option><option value="America/New_York">New York</option>
              <option value="America/Los_Angeles">Los Angeles</option><option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option><option value="Asia/Dubai">Dubai</option>
              <option value="Asia/Tokyo">Tokyo</option><option value="Australia/Sydney">Sydney</option>
              <option value="Africa/Johannesburg">Johannesburg</option>
            </select>
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-2">Music Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {['low', 'medium', 'high'].map((quality) => (
                <button key={quality} onClick={() => setTempSettings({...tempSettings, music_quality: quality})} className={`p-3 rounded-xl border-2 transition-all capitalize ${tempSettings.music_quality === quality ? 'border-purple-500 bg-purple-500/20' : 'border-zinc-700 hover:border-zinc-600'}`}>
                  <span className="text-white text-sm">{quality}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-2">Download Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {['standard', 'high', 'lossless'].map((quality) => (
                <button key={quality} onClick={() => setTempSettings({...tempSettings, download_quality: quality})} className={`p-3 rounded-xl border-2 transition-all capitalize ${tempSettings.download_quality === quality ? 'border-purple-500 bg-purple-500/20' : 'border-zinc-700 hover:border-zinc-600'}`}>
                  <span className="text-white text-sm">{quality}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center justify-between">
              <div><span className="text-white block">Autoplay</span><span className="text-zinc-500 text-xs">Auto-play next track</span></div>
              <button onClick={() => handleToggle('autoplay')} className={`w-12 h-7 rounded-full transition-all ${tempSettings.autoplay ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${tempSettings.autoplay ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>
          <div>
            <label className="flex items-center justify-between">
              <div><span className="text-white block">Show Online Status</span><span className="text-zinc-500 text-xs">Let others see when you're online</span></div>
              <button onClick={() => handleToggle('show_online')} className={`w-12 h-7 rounded-full transition-all ${tempSettings.show_online ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${tempSettings.show_online ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>
          <div>
            <label className="flex items-center justify-between">
              <div><span className="text-white block">Allow Messages</span><span className="text-zinc-500 text-xs">Let others message you</span></div>
              <button onClick={() => handleToggle('allow_messages')} className={`w-12 h-7 rounded-full transition-all ${tempSettings.allow_messages ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${tempSettings.allow_messages ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>
        </div>
        <div className="sticky bottom-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 p-4 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200">Cancel</button>
          <button onClick={onSave} disabled={isSaving} className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. LANGUAGE MODAL
const LanguageModal = ({ settings, onSelect, onClose }) => {
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
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦', native: 'Afrikaans' },
    { code: 'zu', name: 'Zulu', flag: '🇿🇦', native: 'isiZulu' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-950/95 rounded-[2rem] w-full max-w-md border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div><h2 className="text-xl font-bold text-white">Select Language</h2><p className="text-zinc-400 text-sm">Choose your preferred language</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-2 max-h-96 overflow-y-auto">
          {languages.map((lang) => (
            <button key={lang.code} onClick={() => onSelect(lang.code)} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 ${settings.language === lang.code ? 'bg-purple-500/20 border border-purple-500' : 'hover:bg-white/5'}`}>
              <span className="text-2xl">{lang.flag}</span>
              <div className="flex-1 text-left"><span className="text-white block">{lang.name}</span><span className="text-zinc-500 text-xs">{lang.native}</span></div>
              {settings.language === lang.code && <CheckCircle className="w-5 h-5 text-purple-400" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// 4. THEME MODAL
const ThemeModal = ({ settings, onSelect, onClose }) => {
  const themes = [
    { id: 'dark', icon: <Moon className="w-8 h-8" />, label: 'Dark', description: 'Easy on the eyes' },
    { id: 'light', icon: <Sun className="w-8 h-8" />, label: 'Light', description: 'Bright and clean' },
    { id: 'system', icon: <Monitor className="w-8 h-8" />, label: 'System', description: 'Follow your device' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-950/95 rounded-[2rem] w-full max-w-md border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div><h2 className="text-xl font-bold text-white">Choose Theme</h2><p className="text-zinc-400 text-sm">Customize your app appearance</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-4 space-y-3">
          {themes.map((theme) => (
            <button key={theme.id} onClick={() => onSelect(theme.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${settings.theme === theme.id ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20' : 'border-zinc-700 hover:border-zinc-600 hover:bg-white/5'}`}>
              <div className={`p-3 rounded-2xl transition-all duration-200 ${settings.theme === theme.id ? 'bg-purple-500/30' : 'bg-white/[0.06] border border-white/[0.06]'}`}>
                <div className={settings.theme === theme.id ? 'text-purple-400' : 'text-zinc-400'}>{theme.icon}</div>
              </div>
              <div className="flex-1 text-left"><span className="text-white block font-medium">{theme.label}</span><span className="text-zinc-500 text-xs">{theme.description}</span></div>
              {settings.theme === theme.id && <CheckCircle className="w-6 h-6 text-purple-400" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// 5. NOTIFICATIONS MODAL
const NotificationsModal = ({ tempSettings, setTempSettings, onSave, onClose, isSaving }) => {
  const handleToggle = (key) => {
    setTempSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationTypes = [
    { key: 'push_notifications', icon: Bell, label: 'Push Notifications', description: 'Receive push notifications' },
    { key: 'email_notifications', icon: Mail, label: 'Email Notifications', description: 'Receive email updates' },
    { key: 'sms_notifications', icon: MessageCircle, label: 'SMS Notifications', description: 'Receive SMS alerts' },
    { key: 'notifications', icon: Bell, label: 'General Notifications', description: 'All other notifications' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-950/95 rounded-[2rem] w-full max-w-md border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div><h2 className="text-xl font-bold text-white">Notifications</h2><p className="text-zinc-400 text-sm">Manage your notification preferences</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          {notificationTypes.map(({ key, icon: Icon, label, description }) => (
            <div key={key} className="p-4 bg-white/[0.035] rounded-2xl border border-white/[0.07] shadow-inner shadow-white/[0.02]">
              <label className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg"><Icon className="w-4 h-4 text-purple-400" /></div>
                  <div><span className="text-white block text-sm font-medium">{label}</span><span className="text-zinc-500 text-xs">{description}</span></div>
                </div>
                <button onClick={() => handleToggle(key)} className={`w-12 h-7 rounded-full transition-all flex-shrink-0 ${tempSettings[key] ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${tempSettings[key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </label>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/10 flex gap-3 bg-white/[0.02]">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200">Cancel</button>
          <button onClick={onSave} className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-200">Save</button>
        </div>
      </div>
    </div>
  );
};

// 6. PRIVACY MODAL
const PrivacyModal = ({ tempSettings, setTempSettings, onSave, onClose }) => {
  const privacyLevels = [
    { value: 'public', label: 'Public', description: 'Everyone can see your profile' },
    { value: 'friends', label: 'Friends Only', description: 'Only friends can see your profile' },
    { value: 'private', label: 'Private', description: 'Only you can see your profile' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-950/95 rounded-[2rem] w-full max-w-md border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div><h2 className="text-xl font-bold text-white">Privacy Settings</h2><p className="text-zinc-400 text-sm">Control your privacy preferences</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-4 space-y-6">
          <div>
            <label className="text-zinc-400 text-sm block mb-3">Profile Privacy</label>
            <div className="space-y-2">
              {privacyLevels.map((level) => (
                <button key={level.value} onClick={() => setTempSettings({...tempSettings, privacy: level.value})} className={`w-full p-3 rounded-xl border-2 transition-all text-left ${tempSettings.privacy === level.value ? 'border-purple-500 bg-purple-500/20' : 'border-zinc-700 hover:border-zinc-600'}`}>
                  <span className="text-white block font-medium">{level.label}</span><span className="text-zinc-500 text-xs">{level.description}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div><span className="text-white block">Show Online Status</span><span className="text-zinc-500 text-xs">Let others see when you're online</span></div>
              <button onClick={() => setTempSettings({...tempSettings, show_online: !tempSettings.show_online})} className={`w-12 h-7 rounded-full transition-all ${tempSettings.show_online ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${tempSettings.show_online ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>
            <label className="flex items-center justify-between">
              <div><span className="text-white block">Allow Messages</span><span className="text-zinc-500 text-xs">Let others send you messages</span></div>
              <button onClick={() => setTempSettings({...tempSettings, allow_messages: !tempSettings.allow_messages})} className={`w-12 h-7 rounded-full transition-all ${tempSettings.allow_messages ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${tempSettings.allow_messages ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex gap-3 bg-white/[0.02]">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200">Cancel</button>
          <button onClick={onSave} className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-200">Save</button>
        </div>
      </div>
    </div>
  );
};

// 7. TWO-FACTOR AUTH MODAL
const TwoFactorModal = ({ onClose }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const BASE_API = 'https://gigza-testing-11.onrender.com/api';

  const forceGetToken = () => {
    let token = localStorage.getItem('token');
    if (token) return token;
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith('token=')) {
          token = decodeURIComponent(trimmed.substring(6));
          if (token) {
            localStorage.setItem('token', token);
            return token;
          }
        }
      }
    } catch (error) {
      console.error('Error reading cookie:', error);
    }
    return null;
  };

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const token = forceGetToken();
      const response = await fetch(`${BASE_API}/auth/2fa/setup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSetupData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const token = forceGetToken();
      const response = await fetch(`${BASE_API}/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-950/95 rounded-[2rem] w-full max-w-md border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div><h2 className="text-xl font-bold text-white">Two-Factor Authentication</h2><p className="text-zinc-400 text-sm">Add extra security to your account</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <p className="text-purple-300 text-sm">Two-factor authentication adds an extra layer of security to your account. You'll need to enter a verification code from your authenticator app when logging in.</p>
          </div>
          {!setupData ? (
            <button onClick={handleSetup} disabled={isLoading} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50">
              {isLoading ? 'Setting up...' : 'Setup Two-Factor Auth'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-black/50 p-4 rounded-xl text-center">
                <p className="text-zinc-400 text-sm mb-2">Scan this QR code with your authenticator app</p>
                <div className="bg-white p-4 rounded-lg inline-block"><img src={setupData.qr_code} alt="QR Code" className="w-32 h-32" /></div>
                <p className="text-zinc-500 text-xs mt-2">Or enter this code manually: {setupData.secret}</p>
              </div>
              <div>
                <label className="text-zinc-400 text-sm block mb-1.5">Enter Verification Code</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest focus:outline-none focus:border-purple-500" maxLength="6" />
              </div>
              <button onClick={handleVerify} disabled={isLoading || code.length < 6} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50">
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
const FavoritesModal = ({ favorites, onRemove, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] border border-white/[0.08]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div><h2 className="text-xl font-bold text-white">Favorite DJs</h2><p className="text-zinc-400 text-sm">Your saved DJs</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-2 overflow-y-auto max-h-96">
          {favorites.length > 0 ? favorites.map((dj) => (
            <div key={dj.dj_id} className="flex items-center gap-3 p-3 hover:bg-white/[0.06] rounded-2xl transition-all duration-200 group border border-transparent hover:border-white/[0.06]">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"><Music className="w-5 h-5 text-white" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{dj.dj_name}</p>
                <p className="text-zinc-400 text-xs">{dj.primary_genre || 'DJ'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /><span className="text-zinc-500 text-xs">{dj.rating || 0}</span>
                  {dj.is_verified && <span className="text-blue-400 text-xs">✓ Verified</span>}
                </div>
              </div>
              <button onClick={() => onRemove(dj.dj_id)} className="p-2 hover:bg-red-500/20 rounded-lg transition opacity-0 group-hover:opacity-100"><X className="w-4 h-4 text-red-400" /></button>
            </div>
          )) : (
            <div className="text-center py-8"><Heart className="w-12 h-12 text-zinc-600 mx-auto mb-3" /><p className="text-zinc-400">No favorite DJs yet</p><p className="text-zinc-600 text-xs">Start saving your favorite DJs</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

// 9. MY BOOKINGS MODAL
const MyBookingsModal = ({ bookings, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/[0.08]">
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800 p-4 flex items-center justify-between">
          <div><h2 className="text-xl font-bold text-white">My Bookings</h2><p className="text-zinc-400 text-sm">Manage your DJ bookings</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-4 space-y-3">
          {bookings.length > 0 ? bookings.map((booking) => (
            <div key={booking.booking_id} className="p-4 bg-black/30 rounded-2xl border border-white/[0.08]">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-white font-semibold">{booking.dj_name || 'DJ'}</p><p className="text-zinc-500 text-xs mt-1">{booking.event_type || 'DJ Booking'}</p></div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${booking.booking_status === 'confirmed' ? 'bg-green-500/15 text-green-400' : booking.booking_status === 'completed' ? 'bg-blue-500/15 text-blue-400' : booking.booking_status === 'cancelled' ? 'bg-red-500/15 text-red-400' : 'bg-purple-500/15 text-purple-400'}`}>
                  {booking.booking_status || 'Pending'}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-400"><Calendar className="w-4 h-4 text-purple-400" />{booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBD'}</div>
                <div className="flex items-center gap-2 text-zinc-400"><Clock className="w-4 h-4 text-purple-400" />{booking.event_time || 'Time TBD'}</div>
                {booking.location && <div className="flex items-center gap-2 text-zinc-400"><MapPin className="w-4 h-4 text-purple-400" />{booking.location}</div>}
                {booking.total_price && <div className="flex items-center gap-2 text-zinc-400"><CreditCard className="w-4 h-4 text-purple-400" />R{booking.total_price}</div>}
              </div>
            </div>
          )) : (
            <div className="text-center py-10"><Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" /><p className="text-zinc-400">No bookings yet</p><p className="text-zinc-600 text-xs mt-1">Your upcoming bookings will appear here.</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

// 10. FAVOURITE DJS MODAL
const FavouriteDJsModal = ({ favorites, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/[0.08]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div><h2 className="text-xl font-bold text-white">Favourite DJs</h2><p className="text-zinc-400 text-sm">DJs you've saved for later</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-2">
          {favorites.length > 0 ? favorites.map((dj) => (
            <div key={dj.dj_id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0"><Music className="w-5 h-5 text-white" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{dj.dj_name}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{dj.primary_genre || 'Various'}</p>
                <div className="flex items-center gap-1 mt-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /><span className="text-zinc-400 text-xs">{dj.rating || 0}</span></div>
              </div>
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            </div>
          )) : (
            <div className="text-center py-10"><Heart className="w-12 h-12 text-zinc-600 mx-auto mb-3" /><p className="text-zinc-400">No favourite DJs yet</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

// 11. APPEARANCE MODAL
const AppearanceModal = ({ tempSettings, setTempSettings, onSave, onClose, isSaving }) => {
  const themes = [
    { id: 'dark', icon: <Moon className="w-6 h-6" />, label: 'Dark', description: 'Easy on the eyes' },
    { id: 'light', icon: <Sun className="w-6 h-6" />, label: 'Light', description: 'Bright and clean' },
    { id: 'system', icon: <Monitor className="w-6 h-6" />, label: 'System', description: 'Follow your device' }
  ];

  const fontSizes = [
    { id: 'small', label: 'Small' },
    { id: 'medium', label: 'Medium' },
    { id: 'large', label: 'Large' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/[0.08]">
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800 p-4 flex items-center justify-between">
          <div><h2 className="text-xl font-bold text-white">Appearance</h2><p className="text-zinc-400 text-sm">Customize how Gigza looks</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-4 space-y-6">
          <div>
            <label className="text-zinc-400 text-sm block mb-3">Theme</label>
            <div className="space-y-2">
              {themes.map((theme) => (
                <button key={theme.id} onClick={() => setTempSettings({ ...tempSettings, theme: theme.id })} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${tempSettings.theme === theme.id ? 'border-purple-500 bg-purple-500/20' : 'border-zinc-700 hover:border-zinc-600'}`}>
                  <div className="p-2 bg-white/[0.06] border border-white/[0.06] rounded-lg text-zinc-300">{theme.icon}</div>
                  <div className="flex-1 text-left"><span className="text-white block text-sm font-medium">{theme.label}</span><span className="text-zinc-500 text-xs">{theme.description}</span></div>
                  {tempSettings.theme === theme.id && <CheckCircle className="w-5 h-5 text-purple-400" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-3">Font Size</label>
            <div className="grid grid-cols-3 gap-2">
              {fontSizes.map((font) => (
                <button key={font.id} onClick={() => setTempSettings({ ...tempSettings, font_size: font.id })} className={`p-3 rounded-xl border-2 transition-all ${(tempSettings.font_size || 'medium') === font.id ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}>
                  <span className="text-sm">{font.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 p-4 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200">Cancel</button>
          <button onClick={onSave} disabled={isSaving} className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save Appearance'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 12. HELP & SUPPORT MODAL
const HelpSupportModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
    <div className="bg-zinc-950/95 rounded-[2rem] w-full max-w-md border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div><h2 className="text-xl font-bold text-white">Help & Support</h2><p className="text-zinc-400 text-sm">We're here to help</p></div>
        <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
      </div>
      <div className="p-4 space-y-3">
        <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/[0.08] hover:bg-white/5 transition">
          <div className="p-2 bg-purple-500/20 rounded-lg"><HelpCircle className="w-5 h-5 text-purple-400" /></div>
          <div className="flex-1 text-left"><span className="text-white text-sm font-medium block">My Support Tickets</span><span className="text-zinc-500 text-xs">0 open tickets</span></div>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </button>
        <button onClick={() => window.location.href = 'mailto:support@gigza.com'} className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/[0.08] hover:bg-white/5 transition">
          <div className="p-2 bg-blue-500/20 rounded-lg"><MessageCircle className="w-5 h-5 text-blue-400" /></div>
          <div className="flex-1 text-left"><span className="text-white text-sm font-medium block">Contact Support</span><span className="text-zinc-500 text-xs">Get help from the Gigza team</span></div>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </button>
        <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/[0.08] hover:bg-white/5 transition">
          <div className="p-2 bg-green-500/20 rounded-lg"><Edit2 className="w-5 h-5 text-green-400" /></div>
          <div className="flex-1 text-left"><span className="text-white text-sm font-medium block">Create New Ticket</span><span className="text-zinc-500 text-xs">Submit a new support request</span></div>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </button>
      </div>
    </div>
  </div>
);

// 13. DJ APPLICATION MODAL
const DJApplicationModal = ({ onClose }) => {
  const [application, setApplication] = useState({
    experience: '',
    genres: [],
    equipment: '',
    bio: '',
    sample_url: ''
  });
  const [selectedGenres, setSelectedGenres] = useState([]);
  const genres = ['House', 'Techno', 'Trance', 'Dubstep', 'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Jazz', 'Classical', 'Amapiano', 'Afro House', 'Gqom', 'Deep House'];
  const BASE_API = 'https://gigza-testing-11.onrender.com/api';

  const forceGetToken = () => {
    let token = localStorage.getItem('token');
    if (token) return token;
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith('token=')) {
          token = decodeURIComponent(trimmed.substring(6));
          if (token) {
            localStorage.setItem('token', token);
            return token;
          }
        }
      }
    } catch (error) {
      console.error('Error reading cookie:', error);
    }
    return null;
  };

  const handleSubmit = async () => {
    try {
      const token = forceGetToken();
      const response = await fetch(`${BASE_API}/dj/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...application, genres: selectedGenres })
      });
      if (response.ok) {
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/[0.08]">
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800 p-4 flex items-center justify-between">
          <div><h2 className="text-xl font-bold text-white">DJ Application</h2><p className="text-zinc-400 text-sm">Apply to become a DJ</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div><label className="text-zinc-400 text-sm block mb-1.5">Experience (years)</label><input type="number" value={application.experience} onChange={(e) => setApplication({...application, experience: e.target.value})} className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" placeholder="Years of experience" /></div>
          <div><label className="text-zinc-400 text-sm block mb-1.5">Genres</label><div className="flex flex-wrap gap-2">{genres.map((genre) => (<button key={genre} onClick={() => toggleGenre(genre)} className={`px-3 py-1.5 rounded-full text-xs transition-all ${selectedGenres.includes(genre) ? 'bg-purple-500 text-white' : 'bg-white/[0.06] border border-white/[0.06] text-zinc-400 hover:bg-zinc-700'}`}>{genre}</button>))}</div></div>
          <div><label className="text-zinc-400 text-sm block mb-1.5">Equipment</label><input type="text" value={application.equipment} onChange={(e) => setApplication({...application, equipment: e.target.value})} className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" placeholder="Your equipment setup" /></div>
          <div><label className="text-zinc-400 text-sm block mb-1.5">Bio</label><textarea value={application.bio} onChange={(e) => setApplication({...application, bio: e.target.value})} className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none" rows="3" placeholder="Tell us about yourself as a DJ" /></div>
          <div><label className="text-zinc-400 text-sm block mb-1.5">Sample Track URL</label><input type="url" value={application.sample_url} onChange={(e) => setApplication({...application, sample_url: e.target.value})} className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" placeholder="Link to your best mix" /></div>
        </div>
        <div className="sticky bottom-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 p-4 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-200">Submit Application</button>
        </div>
      </div>
    </div>
  );
};

// 14. APP INFO MODAL
const AppInfoModal = ({ onClose }) => {
  const appInfo = {
    version: '2.3.0',
    build: '2024.01.15',
    developer: 'Gigza Team',
    website: 'https://gigza.com',
    email: 'support@gigza.com',
    features: [
      'High-quality audio streaming', 'Offline downloads', 'DJ application system',
      'Social sharing', 'Personalized recommendations', 'Real-time notifications',
      'Multi-language support', 'Dark/Light theme'
    ]
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-950/95 rounded-[2rem] w-full max-w-md border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div><h2 className="text-xl font-bold text-white">App Info</h2><p className="text-zinc-400 text-sm">About Gigza</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mx-auto mb-3 flex items-center justify-center"><Music className="w-10 h-10 text-white" /></div>
            <h3 className="text-xl font-bold text-white">Gigza</h3>
            <p className="text-zinc-400 text-sm">Version {appInfo.version}</p>
            <p className="text-zinc-500 text-xs">Build {appInfo.build}</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-zinc-800"><span className="text-zinc-400 text-sm">Developer</span><span className="text-white text-sm">{appInfo.developer}</span></div>
            <div className="flex justify-between py-2 border-b border-zinc-800"><span className="text-zinc-400 text-sm">Website</span><a href={appInfo.website} className="text-purple-400 text-sm hover:underline">{appInfo.website}</a></div>
            <div className="flex justify-between py-2"><span className="text-zinc-400 text-sm">Email</span><a href={`mailto:${appInfo.email}`} className="text-purple-400 text-sm hover:underline">{appInfo.email}</a></div>
          </div>
          <div><h4 className="text-zinc-400 text-sm font-medium mb-2">Features</h4><div className="grid grid-cols-2 gap-2">{appInfo.features.map((feature, index) => (<div key={index} className="flex items-center gap-2 text-sm"><CheckCircle className="w-3 h-3 text-purple-400" /><span className="text-zinc-300 text-xs">{feature}</span></div>))}</div></div>
        </div>
      </div>
    </div>
  );
};

// 15. CLEAR CACHE MODAL
const ClearCacheModal = ({ onClose }) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);
    try {
      if ('caches' in window) {
        await caches.keys().then(names => { names.forEach(name => { caches.delete(name); }); });
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-950/95 rounded-[2rem] w-full max-w-sm border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-2xl overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center"><Trash2 className="w-8 h-8 text-red-400" /></div>
          <h3 className="text-xl font-bold text-white mb-2">Clear Cache?</h3>
          <p className="text-zinc-400 text-sm mb-6">This will clear all cached data from the app. This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200">Cancel</button>
            <button onClick={handleClear} disabled={isClearing} className="flex-1 px-4 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition disabled:opacity-50">{isClearing ? 'Clearing...' : 'Clear Cache'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 16. CLEAR HISTORY MODAL
const ClearHistoryModal = ({ onClear, onClose }) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await onClear();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-950/95 rounded-[2rem] w-full max-w-sm border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-2xl overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center"><Clock className="w-8 h-8 text-yellow-400" /></div>
          <h3 className="text-xl font-bold text-white mb-2">Clear History?</h3>
          <p className="text-zinc-400 text-sm mb-6">This will clear your search and listening history. This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200">Cancel</button>
            <button onClick={handleClear} disabled={isClearing} className="flex-1 px-4 py-3 rounded-2xl bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition disabled:opacity-50">{isClearing ? 'Clearing...' : 'Clear History'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 17. DOWNLOADS MODAL
const DownloadsModal = ({ onClose }) => {
  const [downloads] = useState([
    { id: 1, title: 'Summer Vibes Mix', size: '45.2 MB', status: 'Completed', date: '2024-01-15' },
    { id: 2, title: 'Midnight Beats', size: '32.8 MB', status: 'Completed', date: '2024-01-14' },
    { id: 3, title: 'Sunset Grooves', size: '58.1 MB', status: 'Downloading', progress: 67 },
  ]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] border border-white/[0.08]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div><h2 className="text-xl font-bold text-white">Downloads</h2><p className="text-zinc-400 text-sm">Your downloaded content</p></div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-2 overflow-y-auto max-h-96">
          {downloads.map((item) => (
            <div key={item.id} className="p-3 hover:bg-white/5 rounded-xl transition">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5"><span className="text-zinc-500 text-xs">{item.size}</span><span className="text-zinc-600 text-xs">•</span><span className="text-zinc-500 text-xs">{item.date}</span></div>
                </div>
                <div className="text-right">
                  {item.status === 'Downloading' ? (
                    <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 text-purple-400 animate-spin" /><span className="text-purple-400 text-xs">{item.progress}%</span></div>
                  ) : <span className="text-green-400 text-xs">{item.status}</span>}
                </div>
              </div>
              {item.status === 'Downloading' && (
                <div className="w-full h-1 bg-zinc-700 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 18. LOGOUT MODAL
const LogoutModal = ({ onLogout, onClose }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    await onLogout();
    setIsLoggingOut(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-950/95 rounded-[2rem] w-full max-w-sm border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-2xl overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center"><LogOut className="w-8 h-8 text-red-400" /></div>
          <h3 className="text-xl font-bold text-white mb-2">Log Out?</h3>
          <p className="text-zinc-400 text-sm mb-6">Are you sure you want to log out? You'll need to sign in again to access your account.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200">Stay</button>
            <button onClick={handleLogoutConfirm} disabled={isLoggingOut} className="flex-1 px-4 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition disabled:opacity-50">{isLoggingOut ? 'Logging out...' : 'Log Out'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ✅ 19. DELETE ACCOUNT MODAL (NEW)
// ============================================
const DeleteAccountModal = ({ onDelete, onClose }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmationText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }
    setError("");
    setIsDeleting(true);
    const result = await onDelete();
    setIsDeleting(false);
    if (result) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-zinc-950/95 rounded-[2rem] w-full max-w-md border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-bold text-white">Delete Account</h2>
            <p className="text-zinc-400 text-sm">Permanently delete your account</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 hover:scale-105">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Warning Box */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold text-sm">⚠️ This action is permanent!</p>
                <p className="text-zinc-400 text-sm mt-1">
                  Deleting your account will permanently remove:
                </p>
                <ul className="text-zinc-500 text-xs mt-2 space-y-1 list-disc list-inside">
                  <li>Your profile information</li>
                  <li>All your bookings and booking history</li>
                  <li>Your favorite DJs and saved events</li>
                  <li>Your DJ application (if applicable)</li>
                  <li>Your payment methods and transaction history</li>
                  <li>All your reviews and ratings</li>
                  <li>Your messages and notifications</li>
                </ul>
                <p className="text-red-400/80 text-xs mt-3 font-medium">
                  This data cannot be recovered!
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="text-zinc-400 text-sm block mb-1.5">
              Type <span className="text-red-400 font-bold">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
              placeholder="Type DELETE here"
              className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
              maxLength="6"
              autoFocus
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isDeleting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Deleting Account...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Trash2 className="w-5 h-5" />
                Permanently Delete Account
              </span>
            )}
          </button>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3 bg-white/[0.02]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN USER PROFILE SCREEN - COMPLETE
// ============================================
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
    font_size: "medium",
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

  // Extended Data States
  const [favoriteDJs, setFavoriteDJs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [devices, setDevices] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [blockedDJs, setBlockedDJs] = useState([]);
  const [consents, setConsents] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [profileSummary, setProfileSummary] = useState(null);

  // ✅ CORRECTED: Use the deployed API URL consistently
  const BASE_API = 'https://gigza-testing-11.onrender.com/api';

  // ====== HELPER: Force get token ======
  const forceGetToken = () => {
    let token = getToken();
    if (token) return token;
    token = localStorage.getItem('token');
    if (token) return token;
    token = sessionStorage.getItem('token');
    if (token) return token;
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith('token=')) {
          token = decodeURIComponent(trimmed.substring(6));
          if (token) {
            localStorage.setItem('token', token);
            return token;
          }
        }
      }
    } catch (error) {
      console.error('Error reading cookie:', error);
    }
    return null;
  };

  // ====== HELPER: Safe fetch ======
  const safeFetch = async (url, options = {}) => {
    try {
      const token = forceGetToken();
      if (!token) {
        return { ok: false, status: 401, data: null };
      }
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        credentials: 'include'
      });
      if (response.status === 401) {
        return { ok: false, status: 401, data: null };
      }
      if (!response.ok) {
        return { ok: false, status: response.status, data: null };
      }
      const data = await response.json();
      return { ok: true, data: data };
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return { ok: false, status: 0, data: null, error };
    }
  };

  // ====== LIFECYCLE ======
  useEffect(() => {
    loadProfile();
    loadSettings();
    loadExtendedData();
    loadBookings();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => clearSuccessMessage(), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ====== BOOKING FUNCTIONS (Using the service) ======

  const loadBookings = async () => {
    try {
      const token = forceGetToken();
      if (!token) return;
      
      const response = await getUserBookings();
      console.log('📚 Bookings loaded:', response);
      
      if (response && response.data && response.data.bookings) {
        setBookings(response.data.bookings);
      } else if (response && response.bookings) {
        setBookings(response.bookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    }
  };

  const handleCreateBooking = async (bookingData) => {
    try {
      const token = forceGetToken();
      if (!token) {
        setError("Not authenticated");
        return false;
      }
      
      const response = await createBooking(bookingData);
      console.log('✅ Booking created:', response);
      
      if (response && response.success) {
        showSuccessMessage("Booking created successfully!");
        await loadBookings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error.message || "Failed to create booking");
      return false;
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const token = forceGetToken();
      if (!token) {
        setError("Not authenticated");
        return false;
      }
      
      const response = await cancelBooking(bookingId);
      console.log('✅ Booking cancelled:', response);
      
      if (response && response.success) {
        showSuccessMessage("Booking cancelled successfully!");
        await loadBookings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError(error.message || "Failed to cancel booking");
      return false;
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      const token = forceGetToken();
      if (!token) {
        setError("Not authenticated");
        return false;
      }
      
      const response = await updateBookingStatus(bookingId, status);
      console.log('✅ Booking status updated:', response);
      
      if (response && response.success) {
        showSuccessMessage(`Booking ${status}!`);
        await loadBookings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating booking status:', error);
      setError(error.message || "Failed to update booking");
      return false;
    }
  };

  // ====== PROFILE FUNCTIONS ======
  const loadProfile = async () => {
    setLoading(true);
    clearError();
    try {
      const token = forceGetToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await fetch(`${BASE_API}/profile`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const profileData = data.data || data;
          updateProfileData(profileData);
        } else if (data.data) {
          updateProfileData(data.data);
        }
      }
    } catch (err) {
      console.error("Error loading profile:", err);
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
      is_dj: userData.role_id === 2 || false,
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
      const token = forceGetToken();
      if (!token) return;
      const response = await fetch(`${BASE_API}/settings`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const settingsData = data.data || data;
        if (settingsData) {
          const newSettings = {
            language: settingsData.language || "en",
            theme: settingsData.theme || "dark",
            font_size: settingsData.font_size || "medium",
            notifications: settingsData.notification_email !== undefined ? settingsData.notification_email : true,
            email_notifications: settingsData.notification_email !== undefined ? settingsData.notification_email : true,
            push_notifications: settingsData.notification_push !== undefined ? settingsData.notification_push : true,
            sms_notifications: settingsData.notification_sms || false,
            two_factor: settingsData.two_factor_enabled || false,
            privacy: settingsData.privacy_profile_public ? "public" : "private",
            show_online: settingsData.privacy_show_online !== undefined ? settingsData.privacy_show_online : true,
            allow_messages: settingsData.privacy_allow_messages !== undefined ? settingsData.privacy_allow_messages : true,
            timezone: settingsData.timezone || "UTC",
            music_quality: settingsData.music_quality || "high",
            autoplay: settingsData.autoplay !== undefined ? settingsData.autoplay : true,
            download_quality: settingsData.download_quality || "high"
          };
          setSettings(newSettings);
          setTempSettings(newSettings);
        }
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  const loadExtendedData = async () => {
    try {
      const token = forceGetToken();
      if (!token) return;
      const results = await Promise.allSettled([
        safeFetch(`${BASE_API}/profile/favorites/djs`),
        safeFetch(`${BASE_API}/profile/payments`),
        safeFetch(`${BASE_API}/profile/addresses`),
        safeFetch(`${BASE_API}/profile/tickets`),
        safeFetch(`${BASE_API}/profile/devices`),
        safeFetch(`${BASE_API}/profile/events/saved`),
        safeFetch(`${BASE_API}/profile/blocked/djs`),
        safeFetch(`${BASE_API}/profile/consents`),
        safeFetch(`${BASE_API}/profile/search/history`),
        safeFetch(`${BASE_API}/profile/summary`)
      ]);
      
      const [favoritesResult, paymentsResult, addressesResult, ticketsResult, 
             devicesResult, eventsResult, blockedResult, consentsResult, 
             historyResult, summaryResult] = results.map(r => r.status === 'fulfilled' ? r.value : { ok: false, data: null });
      
      setFavoriteDJs(favoritesResult.ok ? (favoritesResult.data.data?.favorites || favoritesResult.data?.favorites || []) : []);
      setPaymentMethods(paymentsResult.ok ? (paymentsResult.data.data?.payment_methods || paymentsResult.data?.payment_methods || []) : []);
      setAddresses(addressesResult.ok ? (addressesResult.data.data?.addresses || addressesResult.data?.addresses || []) : []);
      setSupportTickets(ticketsResult.ok ? (ticketsResult.data.data?.tickets || ticketsResult.data?.tickets || []) : []);
      setDevices(devicesResult.ok ? (devicesResult.data.data?.devices || devicesResult.data?.devices || []) : []);
      setSavedEvents(eventsResult.ok ? (eventsResult.data.data?.saved_events || eventsResult.data?.saved_events || []) : []);
      setBlockedDJs(blockedResult.ok ? (blockedResult.data.data?.blocked_djs || blockedResult.data?.blocked_djs || []) : []);
      setConsents(consentsResult.ok ? (consentsResult.data.data?.consents || consentsResult.data?.consents || []) : []);
      setSearchHistory(historyResult.ok ? (historyResult.data.data?.search_history || historyResult.data?.search_history || []) : []);
      setProfileSummary(summaryResult.ok ? (summaryResult.data.data?.summary || summaryResult.data?.summary || null) : null);
    } catch (error) {
      console.error('Error loading extended data:', error);
    }
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    clearError();
    try {
      const token = forceGetToken();
      if (!token) {
        setError("Not authenticated");
        setSettingsSaving(false);
        return;
      }
      const settingsToSave = {
        language: tempSettings.language,
        timezone: tempSettings.timezone,
        theme: tempSettings.theme,
        notification_email: tempSettings.email_notifications,
        notification_push: tempSettings.push_notifications,
        notification_sms: tempSettings.sms_notifications,
        privacy_profile_public: tempSettings.privacy === "public",
        privacy_show_online: tempSettings.show_online,
        privacy_allow_messages: tempSettings.allow_messages,
        two_factor_enabled: tempSettings.two_factor,
        music_quality: tempSettings.music_quality,
        autoplay: tempSettings.autoplay,
        download_quality: tempSettings.download_quality,
        font_size: tempSettings.font_size
      };
      const response = await fetch(`${BASE_API}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify(settingsToSave)
      });
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
      const token = forceGetToken();
      if (!token) {
        setError("Not authenticated");
        return false;
      }
      const profileData = {
        full_name: updatedData.full_name,
        phone_number: updatedData.phone,
        city: updatedData.city,
        bio: updatedData.bio
      };
      const response = await fetch(`${BASE_API}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });
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

  const removeFavoriteDJ = async (djId) => {
    try {
      const token = forceGetToken();
      if (!token) return false;
      const response = await fetch(`${BASE_API}/profile/favorites/djs/${djId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (response.ok) {
        setFavoriteDJs(prev => prev.filter(dj => dj.dj_id !== djId));
        showSuccessMessage("DJ removed from favorites!");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error removing favorite DJ:", error);
      return false;
    }
  };

  const clearSearchHistory = async () => {
    try {
      const token = forceGetToken();
      if (!token) return false;
      const response = await fetch(`${BASE_API}/profile/search/history`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (response.ok) {
        setSearchHistory([]);
        showSuccessMessage("Search history cleared!");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error clearing search history:", error);
      return false;
    }
  };

  // ====== ✅ DELETE ACCOUNT HANDLER ======
  const handleDeleteAccount = async () => {
    try {
      const token = forceGetToken();
      if (!token) {
        setError("Not authenticated");
        return false;
      }

      const response = await fetch(`${BASE_API}/auth/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        // Clear all local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        showSuccessMessage("Account deleted successfully.");
        
        // Navigate to login after a delay
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
        
        return true;
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete account");
        return false;
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      setError("Failed to delete account. Please try again.");
      return false;
    }
  };

  // ====== MODAL FUNCTIONS ======
  const openModal = (modalName) => { setActiveModal(modalName); resetSettings(); };
  const closeModal = () => { setActiveModal(null); resetSettings(); };
  const resetSettings = () => { setTempSettings({ ...settings }); };

  const showSuccessMessage = (message) => { setSuccessMessage(message); };
  const clearSuccessMessage = () => { setSuccessMessage(null); };
  const clearError = () => { setError(null); };

  const handleLogout = async () => {
    try {
      const token = forceGetToken();
      if (token) {
        await fetch(`${BASE_API}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include'
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

  const bookingCount = bookings.length;
  const favoriteCount = favoriteDJs.length;
  const memberYear = profile.join_date ? profile.join_date.split(' ').pop() : '2024';

  return (
    <div className="min-h-screen bg-[#050507] text-white pb-24 relative overflow-hidden">
      {/* ====== MODALS ====== */}
      {activeModal === 'user-info' && (
        <UserInfoModal profile={profile} onUpdate={updateProfile} onClose={closeModal} />
      )}
      {activeModal === 'settings' && (
        <SystemSettingsModal 
          settings={settings}
          tempSettings={tempSettings}
          setTempSettings={setTempSettings}
          onSave={saveSettings}
          onClose={closeModal}
          isSaving={settingsSaving}
        />
      )}
      {activeModal === 'language' && (
        <LanguageModal 
          settings={settings}
          onSelect={async (code) => {
            setTempSettings({...tempSettings, language: code});
            await saveSettings();
          }}
          onClose={closeModal}
        />
      )}
      {activeModal === 'theme' && (
        <ThemeModal 
          settings={settings}
          onSelect={async (theme) => {
            setTempSettings({...tempSettings, theme});
            await saveSettings();
          }}
          onClose={closeModal}
        />
      )}
      {activeModal === 'notifications' && (
        <NotificationsModal 
          tempSettings={tempSettings}
          setTempSettings={setTempSettings}
          onSave={saveSettings}
          onClose={closeModal}
          isSaving={settingsSaving}
        />
      )}
      {activeModal === 'privacy' && (
        <PrivacyModal 
          tempSettings={tempSettings}
          setTempSettings={setTempSettings}
          onSave={saveSettings}
          onClose={closeModal}
        />
      )}
      {activeModal === 'two-factor' && (
        <TwoFactorModal onClose={closeModal} />
      )}
      {activeModal === 'favorites' && (
        <FavoritesModal favorites={favoriteDJs} onRemove={removeFavoriteDJ} onClose={closeModal} />
      )}
      {activeModal === 'bookings' && (
        <MyBookingsModal bookings={bookings} onClose={closeModal} />
      )}
      {activeModal === 'favourite-djs' && (
        <FavouriteDJsModal favorites={favoriteDJs} onClose={closeModal} />
      )}
      {activeModal === 'appearance' && (
        <AppearanceModal 
          tempSettings={tempSettings}
          setTempSettings={setTempSettings}
          onSave={saveSettings}
          onClose={closeModal}
          isSaving={settingsSaving}
        />
      )}
      {activeModal === 'help-support' && (
        <HelpSupportModal onClose={closeModal} />
      )}
      {activeModal === 'downloads' && (
        <DownloadsModal onClose={closeModal} />
      )}
      {activeModal === 'dj-application' && (
        <DJApplicationModal onClose={closeModal} />
      )}
      {activeModal === 'app-info' && (
        <AppInfoModal onClose={closeModal} />
      )}
      {activeModal === 'clear-cache' && (
        <ClearCacheModal onClose={closeModal} />
      )}
      {activeModal === 'clear-history' && (
        <ClearHistoryModal onClear={clearSearchHistory} onClose={closeModal} />
      )}
      {activeModal === 'logout' && (
        <LogoutModal onLogout={handleLogout} onClose={closeModal} />
      )}
      {/* ✅ NEW: Delete Account Modal */}
      {activeModal === 'delete-account' && (
        <DeleteAccountModal 
          onDelete={handleDeleteAccount} 
          onClose={closeModal} 
        />
      )}

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
      <div className="relative bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#1d4ed8] px-6 pt-12 pb-9 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-fuchsia-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <h1 className="relative text-2xl font-bold mb-6 tracking-tight">Profile</h1>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-black/30 border-2 border-white/20 overflow-hidden flex items-center justify-center">
              {profile.profile_picture ? (
                <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white/60">{getInitials()}</span>
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-500 to-blue-500 p-1.5 rounded-full border-2 border-black text-white hover:scale-110 transition"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{profile.full_name || profile.username}</h2>
            <p className="text-purple-200/80 text-sm">@{profile.username}</p>
            {profile.is_dj && (
              <span className="inline-flex items-center gap-1 bg-purple-500/30 px-2 py-0.5 rounded-full text-xs text-purple-200 mt-1">
                <Music className="w-3 h-3" /> DJ
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ====== MAIN MENU ====== */}
      <div className="relative max-w-4xl mx-auto px-4 mt-6 space-y-5">
        <div>
          <h3 className="text-zinc-500 text-[11px] font-semibold uppercase tracking-[0.18em] px-2 mb-2.5">Account</h3>
          <button onClick={() => openModal('user-info')} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/[0.06] rounded-2xl transition-all duration-200 group border border-transparent hover:border-white/[0.06]">
            <div className="p-2.5 bg-purple-500/10 rounded-xl ring-1 ring-purple-400/10"><User className="w-4 h-4 text-purple-400" /></div>
            <span className="flex-1 text-left text-sm">User Information</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
          <button onClick={() => openModal('bookings')} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/[0.06] rounded-2xl transition-all duration-200 group border border-transparent hover:border-white/[0.06]">
            <div className="p-2.5 bg-blue-500/10 rounded-xl ring-1 ring-blue-400/10"><Calendar className="w-4 h-4 text-blue-400" /></div>
            <span className="flex-1 text-left text-sm">My Bookings</span>
            <span className="text-zinc-500 text-xs">{bookingCount} total</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
          <button onClick={() => openModal('favourite-djs')} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/[0.06] rounded-2xl transition-all duration-200 group border border-transparent hover:border-white/[0.06]">
            <div className="p-2.5 bg-red-500/10 rounded-xl ring-1 ring-red-400/10"><Heart className="w-4 h-4 text-red-400" /></div>
            <span className="flex-1 text-left text-sm">Favourite DJs</span>
            <span className="text-zinc-500 text-xs">{favoriteCount} saved</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
        </div>

        <div>
          <h3 className="text-zinc-500 text-[11px] font-semibold uppercase tracking-[0.18em] px-2 mb-2.5">DJ</h3>
          <button onClick={() => openModal('dj-application')} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/[0.06] rounded-2xl transition-all duration-200 group border border-transparent hover:border-white/[0.06]">
            <div className="p-2.5 bg-pink-500/10 rounded-xl ring-1 ring-pink-400/10"><Music className="w-4 h-4 text-pink-400" /></div>
            <span className="flex-1 text-left text-sm">Become a DJ</span>
            {profile.is_dj ? <span className="text-green-400 text-xs font-medium">Active</span> : <span className="text-zinc-500 text-xs">Apply</span>}
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
        </div>

        <div>
          <h3 className="text-zinc-500 text-[11px] font-semibold uppercase tracking-[0.18em] px-2 mb-2.5">Preferences</h3>
          <button onClick={() => openModal('settings')} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/[0.06] rounded-2xl transition-all duration-200 group border border-transparent hover:border-white/[0.06]">
            <div className="p-2.5 bg-blue-500/10 rounded-xl ring-1 ring-blue-400/10"><Settings className="w-4 h-4 text-blue-400" /></div>
            <span className="flex-1 text-left text-sm">Settings</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
          <button onClick={() => openModal('notifications')} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/[0.06] rounded-2xl transition-all duration-200 group border border-transparent hover:border-white/[0.06]">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl ring-1 ring-indigo-400/10"><Bell className="w-4 h-4 text-indigo-400" /></div>
            <span className="flex-1 text-left text-sm">Notifications</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
          <button onClick={() => openModal('appearance')} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/[0.06] rounded-2xl transition-all duration-200 group border border-transparent hover:border-white/[0.06]">
            <div className="p-2.5 bg-yellow-500/10 rounded-xl ring-1 ring-yellow-400/10"><Palette className="w-4 h-4 text-yellow-400" /></div>
            <span className="flex-1 text-left text-sm">Appearance</span>
            <span className="text-zinc-500 text-xs capitalize">{settings.theme}</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
          <button onClick={() => openModal('privacy')} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/[0.06] rounded-2xl transition-all duration-200 group border border-transparent hover:border-white/[0.06]">
            <div className="p-2.5 bg-purple-500/10 rounded-xl ring-1 ring-purple-400/10"><Lock className="w-4 h-4 text-purple-400" /></div>
            <span className="flex-1 text-left text-sm">Privacy & Security</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
        </div>

        <div>
          <h3 className="text-zinc-500 text-[11px] font-semibold uppercase tracking-[0.18em] px-2 mb-2.5">Support</h3>
          <button onClick={() => openModal('help-support')} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/[0.06] rounded-2xl transition-all duration-200 group border border-transparent hover:border-white/[0.06]">
            <div className="p-2.5 bg-green-500/10 rounded-xl ring-1 ring-green-400/10"><HelpCircle className="w-4 h-4 text-green-400" /></div>
            <span className="flex-1 text-left text-sm">Help & Support</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
          <button onClick={() => openModal('app-info')} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-white/[0.06] rounded-2xl transition-all duration-200 group border border-transparent hover:border-white/[0.06]">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl ring-1 ring-indigo-400/10"><Info className="w-4 h-4 text-indigo-400" /></div>
            <span className="flex-1 text-left text-sm">About Gigza</span>
            <span className="text-zinc-500 text-xs">v2.3.0</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
          </button>
        </div>

        {/* Logout */}
        <button onClick={() => openModal('logout')} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-red-500/10 rounded-xl transition group mt-4 border-t border-zinc-800/50 pt-4">
          <div className="p-2.5 bg-red-500/10 rounded-xl ring-1 ring-red-400/10"><LogOut className="w-4 h-4 text-red-400" /></div>
          <span className="flex-1 text-left text-sm text-red-400">Log Out</span>
          <ChevronRight className="w-4 h-4 text-red-500/50 group-hover:text-red-400 transition" />
        </button>

        {/* ✅ NEW: Delete Account */}
        <button onClick={() => openModal('delete-account')} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-red-500/10 rounded-xl transition group">
          <div className="p-2.5 bg-red-500/10 rounded-xl ring-1 ring-red-400/10"><Trash2 className="w-4 h-4 text-red-400" /></div>
          <span className="flex-1 text-left text-sm text-red-400">Delete Account</span>
          <ChevronRight className="w-4 h-4 text-red-500/50 group-hover:text-red-400 transition" />
        </button>
      </div>

      <div className="text-center mt-8">
        <p className="text-zinc-600 text-xs">Gigza v2.3.0</p>
        <p className="text-zinc-700 text-xs mt-1">Member since {profile.join_date}</p>
      </div>
    </div>
  );
}

export default UserProfileScreen;