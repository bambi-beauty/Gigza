// src/UserProfileScreen.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import {
  User, Settings, LogOut, Globe, Moon, Sun, Monitor, ChevronRight,
  Loader2, AlertCircle, Sparkles, Camera, Music, Smartphone, Info,
  CheckCircle, X, Mail, Phone, MapPin, Calendar, Edit2, Shield, Bell,
  Lock, Heart, Star, Download, Languages, CreditCard, Trash2, Clock,
  MessageCircle, Eye, Palette, Volume2, Headphones, HelpCircle, Share2,
  Type, Search, Zap, TrendingUp, Award, Crown, Plus
} from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext/ThisUserContext";
import { getUserBookings } from "../src/services/bookingService";
import { useTheme, THEMES } from "../src/UserContext/ThemeContext";
import { useFont, FONTS } from "../src/UserContext/FontContext";
import { useTranslation } from "../src/hooks/useTranslation";

/* ============================================================
   Reusable UI
   ============================================================ */
const Card = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className={`rounded-3xl border backdrop-blur-xl transition-all duration-300
      ${className}`}
    style={{
      background: "var(--card)",
      borderColor: "var(--border)",
    }}
  >
    {children}
  </motion.div>
);

const Section = ({ label, children, delay = 0 }) => (
  <div>
    <motion.h3
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="text-[11px] font-semibold uppercase tracking-[0.2em] px-3 mb-3"
      style={{ color: "var(--text-mute)" }}
    >
      {label}
    </motion.h3>
    <div className="space-y-1">{children}</div>
  </div>
);

const MenuButton = ({ icon: Icon, label, sublabel, badge, onClick, danger, delay = 0 }) => (
  <motion.button
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full flex items-center gap-4 py-3.5 px-3 rounded-2xl transition-all duration-200 group relative overflow-hidden"
    style={{ background: "transparent" }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    <div
      className="p-2.5 rounded-xl ring-1 relative"
      style={{
        background: danger ? "rgba(239,68,68,0.1)" : "var(--card-hover)",
        borderColor: "var(--border)",
        color: danger ? "#f87171" : "var(--accent)",
      }}
    >
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 text-left">
      <span className="text-sm font-medium block" style={{ color: danger ? "#f87171" : "var(--text)" }}>
        {label}
      </span>
      {sublabel && (
        <span className="text-xs" style={{ color: "var(--text-mute)" }}>{sublabel}</span>
      )}
    </div>
    {badge && (
      <span
        className="text-xs px-2 py-0.5 rounded-full"
        style={{ background: "var(--card-hover)", color: "var(--text-dim)" }}
      >
        {badge}
      </span>
    )}
    <ChevronRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: "var(--text-mute)" }} />
  </motion.button>
);

const Sheet = ({ children, onClose, title, subtitle, maxW = "max-w-lg" }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxW} sm:rounded-3xl rounded-t-3xl border-t sm:border overflow-hidden max-h-[92vh] flex flex-col`}
        style={{ background: "var(--bg-elev)", borderColor: "var(--border)" }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between border-b sticky top-0 z-10 backdrop-blur-xl"
          style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{title}</h2>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-all hover:rotate-90 hover:scale-105"
            style={{ background: "var(--card-hover)" }}
          >
            <X className="w-4 h-4" style={{ color: "var(--text-dim)" }} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </motion.div>
    </motion.div>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    {label && (
      <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-dim)" }}>
        {label}
      </label>
    )}
    <input
      {...props}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2"
      style={{
        background: "var(--card)",
        border: `1px solid var(--border)`,
        color: "var(--text)",
      }}
      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
    />
  </div>
);

const PrimaryBtn = ({ children, className = "", ...props }) => (
  <motion.button
    whileHover={{ y: -1 }}
    whileTap={{ scale: 0.98 }}
    {...props}
    className={`px-5 py-3 rounded-xl font-semibold text-sm text-white shadow-lg transition-all disabled:opacity-50 ${className}`}
    style={{
      background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
      boxShadow: "0 8px 24px -8px var(--accent)",
    }}
  >
    {children}
  </motion.button>
);

const GhostBtn = ({ children, className = "", ...props }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    {...props}
    className={`px-5 py-3 rounded-xl font-medium text-sm transition-all ${className}`}
    style={{ background: "var(--card)", border: `1px solid var(--border)`, color: "var(--text)" }}
  >
    {children}
  </motion.button>
);

/* ============================================================
   Modals
   ============================================================ */

function UserInfoModal({ profile, onUpdate, onClose }) {
  const [data, setData] = useState({
    full_name: profile.full_name || "",
    username: profile.username || "",
    email: profile.email || "",
    phone: profile.phone || "",
    city: profile.city || "",
    bio: profile.bio || "",
    website: profile.website || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(data);
    setSaving(false);
    onClose();
  };

  return (
    <Sheet onClose={onClose} title="User Information" subtitle="Edit your profile details">
      <div className="space-y-4">
        <Input label="Full Name" value={data.full_name} onChange={(e) => setData({ ...data, full_name: e.target.value })} placeholder="Your full name" />
        <Input label="Username" value={data.username} onChange={(e) => setData({ ...data, username: e.target.value })} placeholder="Username" />
        <Input label="Email" type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="Email address" />
        <Input label="Phone" type="tel" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} placeholder="Phone number" />
        <Input label="City" value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} placeholder="Your city" />
        <div>
          <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-dim)" }}>Bio</label>
          <textarea
            value={data.bio}
            onChange={(e) => setData({ ...data, bio: e.target.value })}
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
            style={{ background: "var(--card)", border: `1px solid var(--border)`, color: "var(--text)" }}
            placeholder="Tell us about yourself"
          />
        </div>
        <Input label="Website" type="url" value={data.website} onChange={(e) => setData({ ...data, website: e.target.value })} placeholder="https://..." />
      </div>
      <div className="flex gap-3 mt-6">
        <GhostBtn onClick={onClose} className="flex-1">Cancel</GhostBtn>
        <PrimaryBtn onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "Saving..." : "Save Changes"}
        </PrimaryBtn>
      </div>
    </Sheet>
  );
}

function ThemeModal({ onClose }) {
  const { themeId, setThemeId } = useTheme();
  const { t } = useTranslation();
  return (
    <Sheet onClose={onClose} title={t("chooseTheme")} subtitle="Pick a look that fits your vibe">
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(THEMES).map(([id, theme]) => (
          <motion.button
            key={id}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setThemeId(id)}
            className="relative rounded-2xl overflow-hidden text-left p-3 transition-all"
            style={{
              background: "var(--card)",
              border: `2px solid ${themeId === id ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            <div
              className="h-20 rounded-xl mb-3 relative overflow-hidden"
              style={{ background: theme.preview }}
            >
              {themeId === id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1"
                >
                  <CheckCircle className="w-4 h-4 text-black" />
                </motion.div>
              )}
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{theme.name}</p>
          </motion.button>
        ))}
      </div>
    </Sheet>
  );
}

function FontModal({ onClose }) {
  const { fontId, setFontId, fontScale, setFontScale } = useFont();
  const { t } = useTranslation();
  const sizes = [
    { id: 0.875, label: "Small" },
    { id: 1, label: "Medium" },
    { id: 1.125, label: "Large" },
    { id: 1.25, label: "XL" },
  ];
  return (
    <Sheet onClose={onClose} title={t("fontFamily")} subtitle="Typography and scale">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-dim)" }}>{t("fontFamily")}</p>
          <div className="space-y-2">
            {Object.entries(FONTS).map(([id, f]) => (
              <button
                key={id}
                onClick={() => setFontId(id)}
                className="w-full flex items-center justify-between p-4 rounded-xl transition-all text-left"
                style={{
                  background: "var(--card)",
                  border: `2px solid ${fontId === id ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                <span style={{ fontFamily: f.stack, color: "var(--text)", fontSize: 18 }}>
                  {f.name} — Aa Bb Cc 123
                </span>
                {fontId === id && <CheckCircle className="w-5 h-5" style={{ color: "var(--accent)" }} />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-dim)" }}>{t("fontSize")}</p>
          <div className="grid grid-cols-4 gap-2">
            {sizes.map((s) => (
              <button
                key={s.id}
                onClick={() => setFontScale(s.id)}
                className="py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: fontScale === s.id ? "var(--accent)" : "var(--card)",
                  color: fontScale === s.id ? "white" : "var(--text)",
                  border: `1px solid ${fontScale === s.id ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function LanguageModal({ onClose }) {
  const { lang, setLang, loading } = useTranslation();
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const languages = [
    { code: "en", name: "English", flag: "🇬🇧", native: "English" },
    { code: "es", name: "Spanish", flag: "🇪🇸", native: "Español" },
    { code: "fr", name: "French", flag: "🇫🇷", native: "Français" },
    { code: "de", name: "German", flag: "🇩🇪", native: "Deutsch" },
    { code: "it", name: "Italian", flag: "🇮🇹", native: "Italiano" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹", native: "Português" },
    { code: "ru", name: "Russian", flag: "🇷🇺", native: "Русский" },
    { code: "zh", name: "Chinese", flag: "🇨🇳", native: "中文" },
    { code: "ja", name: "Japanese", flag: "🇯🇵", native: "日本語" },
    { code: "ko", name: "Korean", flag: "🇰🇷", native: "한국어" },
    { code: "ar", name: "Arabic", flag: "🇸🇦", native: "العربية" },
    { code: "hi", name: "Hindi", flag: "🇮🇳", native: "हिन्दी" },
    { code: "af", name: "Afrikaans", flag: "🇿🇦", native: "Afrikaans" },
    { code: "zu", name: "Zulu", flag: "🇿🇦", native: "isiZulu" },
  ];
  const filtered = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(q.toLowerCase()) ||
      l.native.toLowerCase().includes(q.toLowerCase()) ||
      l.code.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Sheet onClose={onClose} title={t("chooseLanguage")} subtitle="UI text translates automatically">
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-mute)" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search languages..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--card)", border: `1px solid var(--border)`, color: "var(--text)" }}
        />
      </div>
      <div className="space-y-1.5">
        {filtered.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
            style={{
              background: lang === l.code ? "var(--card-hover)" : "transparent",
              border: `1px solid ${lang === l.code ? "var(--accent)" : "transparent"}`,
            }}
          >
            <span className="text-2xl">{l.flag}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{l.name}</p>
              <p className="text-xs" style={{ color: "var(--text-mute)" }}>{l.native}</p>
            </div>
            {lang === l.code && (loading ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--accent)" }} /> : <CheckCircle className="w-5 h-5" style={{ color: "var(--accent)" }} />)}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function NotificationsModal({ tempSettings, setTempSettings, onSave, onClose, isSaving }) {
  const { t } = useTranslation();
  const toggle = (k) => setTempSettings((p) => ({ ...p, [k]: !p[k] }));
  const types = [
    { key: "push_notifications", icon: Bell, label: "Push Notifications", desc: "In-app alerts" },
    { key: "email_notifications", icon: Mail, label: "Email Notifications", desc: "Email updates" },
    { key: "sms_notifications", icon: MessageCircle, label: "SMS Notifications", desc: "Text alerts" },
    { key: "notifications", icon: Bell, label: "General Notifications", desc: "Everything else" },
  ];
  return (
    <Sheet onClose={onClose} title={t("notifications")} subtitle="Manage what reaches you">
      <div className="space-y-3">
        {types.map(({ key, icon: Icon, label, desc }) => (
          <div key={key} className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "var(--card)", border: `1px solid var(--border)` }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "var(--card-hover)" }}>
                <Icon className="w-4 h-4" style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</p>
                <p className="text-xs" style={{ color: "var(--text-mute)" }}>{desc}</p>
              </div>
            </div>
            <Switch checked={!!tempSettings[key]} onChange={() => toggle(key)} />
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <GhostBtn onClick={onClose} className="flex-1">Cancel</GhostBtn>
        <PrimaryBtn onClick={onSave} disabled={isSaving} className="flex-1">
          {isSaving ? "Saving..." : "Save"}
        </PrimaryBtn>
      </div>
    </Sheet>
  );
}

const Switch = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className="w-12 h-7 rounded-full transition-all relative flex-shrink-0"
    style={{ background: checked ? "var(--accent)" : "var(--card-hover)" }}
  >
    <motion.div
      animate={{ x: checked ? 22 : 2 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="w-5 h-5 rounded-full bg-white absolute top-1 shadow"
    />
  </button>
);

function PrivacyModal({ tempSettings, setTempSettings, onSave, onClose }) {
  const { t } = useTranslation();
  const levels = [
    { value: "public", label: "Public", desc: "Everyone can see" },
    { value: "friends", label: "Friends Only", desc: "Friends see" },
    { value: "private", label: "Private", desc: "Only you" },
  ];
  return (
    <Sheet onClose={onClose} title={t("privacy")}>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-dim)" }}>Profile Privacy</p>
          <div className="space-y-2">
            {levels.map((l) => (
              <button
                key={l.value}
                onClick={() => setTempSettings({ ...tempSettings, privacy: l.value })}
                className="w-full p-3.5 rounded-xl text-left transition-all"
                style={{
                  background: "var(--card)",
                  border: `2px solid ${tempSettings.privacy === l.value ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{l.label}</p>
                <p className="text-xs" style={{ color: "var(--text-mute)" }}>{l.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <ToggleRow
            label="Show Online Status"
            desc="Let others see when you're online"
            checked={tempSettings.show_online}
            onChange={() => setTempSettings({ ...tempSettings, show_online: !tempSettings.show_online })}
          />
          <ToggleRow
            label="Allow Messages"
            desc="Let others message you"
            checked={tempSettings.allow_messages}
            onChange={() => setTempSettings({ ...tempSettings, allow_messages: !tempSettings.allow_messages })}
          />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <GhostBtn onClick={onClose} className="flex-1">Cancel</GhostBtn>
        <PrimaryBtn onClick={onSave} className="flex-1">Save</PrimaryBtn>
      </div>
    </Sheet>
  );
}

const ToggleRow = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: "var(--card)", border: `1px solid var(--border)` }}>
    <div>
      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</p>
      <p className="text-xs" style={{ color: "var(--text-mute)" }}>{desc}</p>
    </div>
    <Switch checked={checked} onChange={onChange} />
  </div>
);

function BookingsModal({ bookings, onClose }) {
  const { t } = useTranslation();
  return (
    <Sheet onClose={onClose} title={t("myBookings")} subtitle={`${bookings.length} total`}>
      {bookings.length === 0 ? (
        <EmptyState icon={Calendar} title="No bookings yet" sub="Your upcoming events will show up here." />
      ) : (
        <div className="space-y-3">
          {bookings.map((b, i) => (
            <motion.div
              key={b.booking_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl"
              style={{ background: "var(--card)", border: `1px solid var(--border)` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{b.dj_name || "DJ"}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-mute)" }}>{b.event_type || "DJ Booking"}</p>
                </div>
                <StatusPill status={b.booking_status} />
              </div>
              <div className="mt-3 space-y-1.5 text-xs" style={{ color: "var(--text-dim)" }}>
                {b.event_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                    {new Date(b.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </div>
                )}
                {b.event_time && <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />{b.event_time}</div>}
                {b.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />{b.location}</div>}
                {b.total_price && <div className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />R{b.total_price}</div>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

const StatusPill = ({ status }) => {
  const map = {
    confirmed: { bg: "rgba(34,197,94,0.15)", c: "#4ade80" },
    completed: { bg: "rgba(59,130,246,0.15)", c: "#60a5fa" },
    cancelled: { bg: "rgba(239,68,68,0.15)", c: "#f87171" },
    pending:   { bg: "rgba(168,85,247,0.15)", c: "#c084fc" },
  };
  const style = map[status] || map.pending;
  return (
    <span className="text-xs px-2.5 py-1 rounded-full capitalize font-medium" style={{ background: style.bg, color: style.c }}>
      {status || "Pending"}
    </span>
  );
};

const EmptyState = ({ icon: Icon, title, sub }) => (
  <div className="text-center py-10">
    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--card-hover)" }}>
      <Icon className="w-7 h-7" style={{ color: "var(--text-mute)" }} />
    </div>
    <p className="text-sm font-medium" style={{ color: "var(--text-dim)" }}>{title}</p>
    {sub && <p className="text-xs mt-1" style={{ color: "var(--text-mute)" }}>{sub}</p>}
  </div>
);

function FavoritesModal({ favorites, onRemove, onClose }) {
  const { t } = useTranslation();
  return (
    <Sheet onClose={onClose} title={t("favouriteDJs")} subtitle={`${favorites.length} saved`}>
      {favorites.length === 0 ? (
        <EmptyState icon={Heart} title="No favorites yet" sub="Tap the heart on any DJ to save them." />
      ) : (
        <div className="space-y-2">
          {favorites.map((dj) => (
            <div
              key={dj.dj_id}
              className="flex items-center gap-3 p-3 rounded-2xl group"
              style={{ background: "var(--card)", border: `1px solid var(--border)` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              >
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{dj.dj_name}</p>
                <p className="text-xs" style={{ color: "var(--text-mute)" }}>{dj.primary_genre || "DJ"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs" style={{ color: "var(--text-dim)" }}>{dj.rating || 0}</span>
                </div>
              </div>
              <button
                onClick={() => onRemove(dj.dj_id)}
                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
                style={{ background: "rgba(239,68,68,0.15)" }}
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

function HelpSupportModal({ onClose }) {
  const { t } = useTranslation();
  const items = [
    { icon: HelpCircle, label: "My Support Tickets", sub: "0 open tickets", color: "#c084fc" },
    { icon: MessageCircle, label: "Contact Support", sub: "Email us", color: "#60a5fa", action: () => (window.location.href = "mailto:support@gigza.com") },
    { icon: Edit2, label: "Create New Ticket", sub: "Submit a request", color: "#4ade80" },
  ];
  return (
    <Sheet onClose={onClose} title={t("helpSupport")} subtitle="We're here to help">
      <div className="space-y-2">
        {items.map(({ icon: Icon, label, sub, color, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-full flex items-center gap-3 p-4 rounded-2xl transition"
            style={{ background: "var(--card)", border: `1px solid var(--border)` }}
          >
            <div className="p-2.5 rounded-xl" style={{ background: `${color}20` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</p>
              <p className="text-xs" style={{ color: "var(--text-mute)" }}>{sub}</p>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "var(--text-mute)" }} />
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function DJApplicationModal({ onClose }) {
  const [app, setApp] = useState({ experience: "", equipment: "", bio: "", sample_url: "" });
  const [genres, setGenres] = useState([]);
  const [saving, setSaving] = useState(false);
  const allGenres = ["House", "Techno", "Trance", "Dubstep", "Hip-Hop", "R&B", "Pop", "Rock", "Jazz", "Amapiano", "Afro House", "Gqom", "Deep House"];
  const BASE_API = "https://gigza-testing-11.onrender.com/api";

  const submit = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${BASE_API}/dj/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...app, genres }),
      });
      onClose();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const toggle = (g) => setGenres((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]));

  return (
    <Sheet onClose={onClose} title="DJ Application" subtitle="Apply to become a DJ">
      <div className="space-y-4">
        <Input label="Years of Experience" type="number" value={app.experience} onChange={(e) => setApp({ ...app, experience: e.target.value })} />
        <div>
          <label className="block text-xs mb-2 font-medium" style={{ color: "var(--text-dim)" }}>Genres</label>
          <div className="flex flex-wrap gap-2">
            {allGenres.map((g) => (
              <button
                key={g}
                onClick={() => toggle(g)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                style={{
                  background: genres.includes(g) ? "var(--accent)" : "var(--card)",
                  color: genres.includes(g) ? "white" : "var(--text-dim)",
                  border: `1px solid ${genres.includes(g) ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <Input label="Equipment" value={app.equipment} onChange={(e) => setApp({ ...app, equipment: e.target.value })} placeholder="CDJs, mixer, etc." />
        <div>
          <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-dim)" }}>Bio</label>
          <textarea
            value={app.bio}
            onChange={(e) => setApp({ ...app, bio: e.target.value })}
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
            style={{ background: "var(--card)", border: `1px solid var(--border)`, color: "var(--text)" }}
          />
        </div>
        <Input label="Sample Track URL" value={app.sample_url} onChange={(e) => setApp({ ...app, sample_url: e.target.value })} placeholder="https://soundcloud.com/..." />
      </div>
      <div className="flex gap-3 mt-6">
        <GhostBtn onClick={onClose} className="flex-1">Cancel</GhostBtn>
        <PrimaryBtn onClick={submit} disabled={saving} className="flex-1">
          {saving ? "Submitting..." : "Submit Application"}
        </PrimaryBtn>
      </div>
    </Sheet>
  );
}

function AppInfoModal({ onClose }) {
  const { t } = useTranslation();
  return (
    <Sheet onClose={onClose} title={t("aboutGigza")}>
      <div className="text-center mb-6">
        <div
          className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-2xl"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          <Music className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>Gigza</h3>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>Version 2.4.0</p>
        <p className="text-xs" style={{ color: "var(--text-mute)" }}>Build 2024.11.15</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {["High-quality audio", "Offline downloads", "DJ applications", "Social sharing", "Smart recommendations", "Real-time alerts", "Multi-language", "5 themes"].map((f) => (
          <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-dim)" }}>
            <CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
            {f}
          </div>
        ))}
      </div>
    </Sheet>
  );
}

function ConfirmActionModal({ icon: Icon, iconColor, title, sub, confirmLabel, confirmColor = "#ef4444", onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };
  return (
    <Sheet onClose={onClose} title={title} maxW="max-w-sm">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${iconColor}20` }}>
          <Icon className="w-8 h-8" style={{ color: iconColor }} />
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-dim)" }}>{sub}</p>
        <div className="flex gap-3">
          <GhostBtn onClick={onClose} className="flex-1">Cancel</GhostBtn>
          <PrimaryBtn
            onClick={handle}
            disabled={loading}
            className="flex-1"
            style={{ background: confirmColor, boxShadow: `0 8px 24px -8px ${confirmColor}` }}
          >
            {loading ? "..." : confirmLabel}
          </PrimaryBtn>
        </div>
      </div>
    </Sheet>
  );
}

function DeleteAccountModal({ onDelete, onClose }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (text !== "DELETE") { setError('Type "DELETE" to confirm'); return; }
    setError("");
    setLoading(true);
    const ok = await onDelete();
    setLoading(false);
    if (ok) onClose();
  };

  return (
    <Sheet onClose={onClose} title="Delete Account" subtitle="This cannot be undone">
      <div className="p-4 rounded-2xl mb-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">⚠️ Permanent action</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
              Your profile, bookings, favorites, reviews, and history will be permanently erased.
            </p>
          </div>
        </div>
      </div>
      <Input
        label={<>Type <span className="text-red-400 font-bold">DELETE</span> to confirm</>}
        value={text}
        onChange={(e) => setText(e.target.value.toUpperCase())}
        placeholder="Type DELETE"
        maxLength={6}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      <div className="flex gap-3 mt-6">
        <GhostBtn onClick={onClose} className="flex-1">Cancel</GhostBtn>
        <PrimaryBtn
          onClick={handle}
          disabled={loading}
          className="flex-1"
          style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", boxShadow: "0 8px 24px -8px #dc2626" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <><Trash2 className="w-4 h-4 inline mr-2" />Delete Forever</>}
        </PrimaryBtn>
      </div>
    </Sheet>
  );
}

/* ============================================================
   MAIN SCREEN
   ============================================================ */
export function UserProfileScreen() {
  const { user, logout, getToken } = useUser();
  const navigate = useNavigate();
  const { themeId, theme } = useTheme();
  const { fontId } = useFont();
  const { t, lang } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    full_name: "", username: "", email: "", phone: "", city: "",
    profile_picture: null, join_date: "", is_dj: false, bio: "", website: "",
    social_links: { instagram: "", twitter: "", soundcloud: "" },
  });

  const [settings, setSettings] = useState({
    language: "en", theme: "dark", font_size: "medium",
    notifications: true, email_notifications: true, push_notifications: true,
    sms_notifications: false, two_factor: false, privacy: "public",
    show_online: true, allow_messages: true, timezone: "UTC",
    music_quality: "high", autoplay: true, download_quality: "high",
  });
  const [tempSettings, setTempSettings] = useState({ ...settings });
  const [favoriteDJs, setFavoriteDJs] = useState([]);
  const [bookings, setBookings] = useState([]);

  const BASE_API = "https://gigza-testing-11.onrender.com/api";

  const forceGetToken = () => {
    let token = getToken?.() || localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) return token;
    try {
      for (const c of document.cookie.split(";")) {
        const t = c.trim();
        if (t.startsWith("token=")) {
          token = decodeURIComponent(t.substring(6));
          if (token) { localStorage.setItem("token", token); return token; }
        }
      }
    } catch {}
    return null;
  };

  const safeFetch = async (url, options = {}) => {
    try {
      const token = forceGetToken();
      if (!token) return { ok: false, status: 401, data: null };
      const res = await fetch(url, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
        credentials: "include",
      });
      if (!res.ok) return { ok: false, status: res.status, data: null };
      return { ok: true, data: await res.json() };
    } catch (e) {
      console.error(e);
      return { ok: false, status: 0, data: null };
    }
  };

  useEffect(() => {
    loadProfile();
    loadSettings();
    loadExtendedData();
    loadBookings();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const token = forceGetToken();
      if (!token) { setLoading(false); return; }
      const res = await fetch(`${BASE_API}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const p = data.data || data;
        const u = p.user || {};
        const pr = p.profile || {};
        setProfile({
          full_name: pr.full_name || u.username || "",
          username: u.username || "",
          email: u.email || "",
          phone: pr.phone_number || "",
          city: pr.city || "",
          profile_picture: pr.profile_picture || null,
          join_date: u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "January 2024",
          is_dj: u.role_id === 2,
          bio: pr.bio || "",
          website: pr.website || "",
          social_links: { instagram: pr.instagram || "", twitter: pr.twitter || "", soundcloud: pr.soundcloud || "" },
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadSettings = async () => {
    try {
      const token = forceGetToken();
      if (!token) return;
      const res = await fetch(`${BASE_API}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const s = data.data || data;
        const next = {
          language: s.language || "en",
          theme: s.theme || "dark",
          font_size: s.font_size || "medium",
          notifications: s.notification_email ?? true,
          email_notifications: s.notification_email ?? true,
          push_notifications: s.notification_push ?? true,
          sms_notifications: s.notification_sms || false,
          two_factor: s.two_factor_enabled || false,
          privacy: s.privacy_profile_public ? "public" : "private",
          show_online: s.privacy_show_online ?? true,
          allow_messages: s.privacy_allow_messages ?? true,
          timezone: s.timezone || "UTC",
          music_quality: s.music_quality || "high",
          autoplay: s.autoplay ?? true,
          download_quality: s.download_quality || "high",
        };
        setSettings(next);
        setTempSettings(next);
      }
    } catch (e) { console.error(e); }
  };

  const loadExtendedData = async () => {
    const token = forceGetToken();
    if (!token) return;
    const [fav] = await Promise.all([safeFetch(`${BASE_API}/profile/favorites/djs`)]);
    if (fav.ok) setFavoriteDJs(fav.data.data?.favorites || fav.data?.favorites || []);
  };

  const loadBookings = async () => {
    try {
      const token = forceGetToken();
      if (!token) return;
      const res = await getUserBookings();
      if (res?.data?.bookings) setBookings(res.data.bookings);
      else if (res?.bookings) setBookings(res.bookings);
    } catch (e) { console.error(e); }
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const token = forceGetToken();
      if (!token) { setSettingsSaving(false); return false; }
      const res = await fetch(`${BASE_API}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({
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
          font_size: tempSettings.font_size,
        }),
      });
      if (res.ok) {
        setSettings({ ...tempSettings });
        setSuccessMessage("Settings updated successfully!");
        setActiveModal(null);
        return true;
      }
    } catch (e) { console.error(e); }
    setSettingsSaving(false);
    return false;
  };

  const updateProfile = async (data) => {
    try {
      const token = forceGetToken();
      const res = await fetch(`${BASE_API}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({
          full_name: data.full_name,
          phone_number: data.phone,
          city: data.city,
          bio: data.bio,
        }),
      });
      if (res.ok) {
        setProfile((p) => ({ ...p, ...data }));
        setSuccessMessage("Profile updated!");
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const removeFavoriteDJ = async (djId) => {
    try {
      const token = forceGetToken();
      await fetch(`${BASE_API}/profile/favorites/djs/${djId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      setFavoriteDJs((p) => p.filter((d) => d.dj_id !== djId));
      setSuccessMessage("Removed from favorites");
    } catch (e) { console.error(e); }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = forceGetToken();
      const res = await fetch(`${BASE_API}/auth/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        setTimeout(() => navigate("/login", { replace: true }), 1200);
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const handleLogout = async () => {
    try {
      const token = forceGetToken();
      if (token) {
        await fetch(`${BASE_API}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
      }
    } catch {}
    logout?.();
    navigate("/login");
  };

  const initials = useMemo(() => {
    if (profile.full_name) return profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return profile.username?.slice(0, 2).toUpperCase() || "U";
  }, [profile.full_name, profile.username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 rounded-full mx-auto mb-4"
            style={{ background: "conic-gradient(from 0deg, var(--accent), var(--accent-2), var(--accent-3), var(--accent))" }}
          />
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen pb-24 relative overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-family)" }}>
        {/* Animated background orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -left-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
          />
          <motion.div
            animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-40 -right-32 w-96 h-96 rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--accent-2), transparent 70%)" }}
          />
        </div>

        {/* Header */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 50%, var(--accent-3) 100%)`,
            }}
          />
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/20 blur-3xl"
          />
          <div className="relative px-6 pt-14 pb-20">
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-white mb-8 tracking-tight"
            >
              {t("profile")}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-5"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full p-1" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2))" }}>
                  <div className="w-full h-full rounded-full bg-black/40 backdrop-blur overflow-hidden flex items-center justify-center border border-white/20">
                    {profile.profile_picture ? (
                      <img src={profile.profile_picture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-white/90">{initials}</span>
                    )}
                  </div>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" />
                <motion.button
                  whileHover={{ scale: 1.15, rotate: 10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full text-white border-2 border-black/40 shadow-xl"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                >
                  <Camera className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white truncate">
                  {profile.full_name || profile.username}
                </h2>
                <p className="text-sm text-white/70 mt-0.5">@{profile.username}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.is_dj && (
                    <span className="inline-flex items-center gap-1 bg-black/30 backdrop-blur px-2.5 py-1 rounded-full text-xs text-white font-medium border border-white/20">
                      <Crown className="w-3 h-3" /> Pro DJ
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 bg-black/30 backdrop-blur px-2.5 py-1 rounded-full text-xs text-white font-medium border border-white/20">
                    <Star className="w-3 h-3" /> Member {profile.join_date || "2024"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Stat pills */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3 mt-8"
            >
              {[
                { icon: Calendar, label: "Bookings", value: bookings.length },
                { icon: Heart, label: "Favorites", value: favoriteDJs.length },
                { icon: Award, label: "Reviews", value: 0 },
              ].map(({ icon: Icon, label, value }, i) => (
                <div key={i} className="bg-black/25 backdrop-blur-xl rounded-2xl p-3 text-center border border-white/10">
                  <Icon className="w-4 h-4 mx-auto mb-1 text-white/80" />
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative max-w-2xl mx-auto px-4 -mt-10 space-y-6">
          <Card className="p-2" delay={0.3}>
            <Section label="Account">
              <MenuButton icon={User} label={t("userInfo")} onClick={() => setActiveModal("user-info")} />
              <MenuButton icon={Calendar} label={t("myBookings")} badge={`${bookings.length}`} onClick={() => setActiveModal("bookings")} />
              <MenuButton icon={Heart} label={t("favouriteDJs")} badge={`${favoriteDJs.length}`} onClick={() => setActiveModal("favourite-djs")} />
            </Section>
          </Card>

          <Card className="p-2" delay={0.4}>
            <Section label="DJ">
              <MenuButton
                icon={Music}
                label={t("becomeDJ")}
                sublabel={profile.is_dj ? "You're a DJ" : "Apply now"}
                badge={profile.is_dj ? "Active" : "Apply"}
                onClick={() => setActiveModal("dj-application")}
              />
            </Section>
          </Card>

          <Card className="p-2" delay={0.5}>
            <Section label="Preferences">
              <MenuButton icon={Palette} label={t("appearance")} sublabel={theme?.name || "Dark"} onClick={() => setActiveModal("theme")} />
              <MenuButton icon={Type} label={t("fontFamily")} sublabel={FONTS[fontId]?.name} onClick={() => setActiveModal("font")} />
              <MenuButton icon={Languages} label="Language" sublabel={lang.toUpperCase()} onClick={() => setActiveModal("language")} />
              <MenuButton icon={Bell} label={t("notifications")} onClick={() => setActiveModal("notifications")} />
              <MenuButton icon={Lock} label={t("privacy")} onClick={() => setActiveModal("privacy")} />
            </Section>
          </Card>

          <Card className="p-2" delay={0.6}>
            <Section label="Support">
              <MenuButton icon={HelpCircle} label={t("helpSupport")} onClick={() => setActiveModal("help-support")} />
              <MenuButton icon={Info} label={t("aboutGigza")} badge="v2.4.0" onClick={() => setActiveModal("app-info")} />
            </Section>
          </Card>

          <Card className="p-2" delay={0.7}>
            <MenuButton icon={LogOut} label={t("logOut")} danger onClick={() => setActiveModal("logout")} />
            <MenuButton icon={Trash2} label={t("deleteAccount")} danger onClick={() => setActiveModal("delete-account")} />
          </Card>

          <div className="text-center pt-4 pb-2">
            <p className="text-xs" style={{ color: "var(--text-mute)" }}>Gigza v2.4.0</p>
          </div>
        </div>

        {/* Toasts */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium flex items-center gap-2 backdrop-blur-xl"
              style={{ background: "rgba(34,197,94,0.9)", color: "white" }}
            >
              <CheckCircle className="w-4 h-4" /> {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <AnimatePresence>
          {activeModal === "user-info" && <UserInfoModal key="ui" profile={profile} onUpdate={updateProfile} onClose={() => setActiveModal(null)} />}
          {activeModal === "theme" && <ThemeModal key="th" onClose={() => setActiveModal(null)} />}
          {activeModal === "font" && <FontModal key="fo" onClose={() => setActiveModal(null)} />}
          {activeModal === "language" && <LanguageModal key="la" onClose={() => setActiveModal(null)} />}
          {activeModal === "notifications" && (
            <NotificationsModal
              key="no"
              tempSettings={tempSettings}
              setTempSettings={setTempSettings}
              onSave={saveSettings}
              onClose={() => setActiveModal(null)}
              isSaving={settingsSaving}
            />
          )}
          {activeModal === "privacy" && (
            <PrivacyModal
              key="pr"
              tempSettings={tempSettings}
              setTempSettings={setTempSettings}
              onSave={saveSettings}
              onClose={() => setActiveModal(null)}
            />
          )}
          {activeModal === "bookings" && <BookingsModal key="bk" bookings={bookings} onClose={() => setActiveModal(null)} />}
          {activeModal === "favourite-djs" && <FavoritesModal key="fv" favorites={favoriteDJs} onRemove={removeFavoriteDJ} onClose={() => setActiveModal(null)} />}
          {activeModal === "help-support" && <HelpSupportModal key="hs" onClose={() => setActiveModal(null)} />}
          {activeModal === "dj-application" && <DJApplicationModal key="dj" onClose={() => setActiveModal(null)} />}
          {activeModal === "app-info" && <AppInfoModal key="ai" onClose={() => setActiveModal(null)} />}
          {activeModal === "logout" && (
            <ConfirmActionModal
              key="lo"
              icon={LogOut}
              iconColor="#ef4444"
              title="Log Out?"
              sub="You'll need to sign in again to access your account."
              confirmLabel="Log Out"
              onConfirm={handleLogout}
              onClose={() => setActiveModal(null)}
            />
          )}
          {activeModal === "delete-account" && <DeleteAccountModal key="da" onDelete={handleDeleteAccount} onClose={() => setActiveModal(null)} />}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

export default UserProfileScreen;