import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Camera, Music, Banknote, Save, CheckCircle2, RotateCcw,
  Eye, Sparkles, X, Upload, AlertCircle, Image as ImageIcon,
} from "lucide-react";

const AVAILABLE_GENRES = [
  "House", "Techno", "Hip Hop", "EDM", "RnB",
  "Trance", "Amapiano", "Pop", "Afrobeat", "Disco",
];

const MAX_BIO = 240;
const MAX_GENRES = 5;
const MIN_GENRES = 1;

const DEFAULT_PORTFOLIO = {
  stageName: "DJ Pulse",
  hourlyRate: 800,
  bio: "Bringing the best energy to your private events.",
  genres: ["House", "Amapiano"],
  heroImage: null,
};

export function DJPortfolioEditor() {
  const fileInputRef = useRef(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);
  const [lastSaved, setLastSaved] = useState(DEFAULT_PORTFOLIO);
  const [toast, setToast] = useState(null);

  // load
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("gigzaDJPortfolio"));
    if (saved) {
      setPortfolio(saved);
      setLastSaved(saved);
    }
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(portfolio) !== JSON.stringify(lastSaved),
    [portfolio, lastSaved]
  );

  const bioRemaining = MAX_BIO - (portfolio.bio?.length || 0);
  const bioOver = bioRemaining < 0;

  const canSave =
    !bioOver &&
    portfolio.genres.length >= MIN_GENRES &&
    portfolio.genres.length <= MAX_GENRES &&
    portfolio.stageName.trim().length > 0;

  const update = useCallback((patch) => {
    setPortfolio((p) => ({ ...p, ...patch }));
  }, []);

  const showToast = (message, tone = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = () => {
    if (!canSave) return;
    localStorage.setItem("gigzaDJPortfolio", JSON.stringify(portfolio));
    setLastSaved(portfolio);
    setIsSaved(true);
    showToast("Portfolio saved");
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    if (!isDirty) return;
    if (!window.confirm("Discard all unsaved changes?")) return;
    setPortfolio(lastSaved);
    showToast("Changes discarded", "neutral");
  };

  const toggleGenre = (genre) => {
    const has = portfolio.genres.includes(genre);
    if (!has && portfolio.genres.length >= MAX_GENRES) {
      showToast(`Max ${MAX_GENRES} genres — remove one first`, "warn");
      return;
    }
    update({
      genres: has
        ? portfolio.genres.filter((g) => g !== genre)
        : [...portfolio.genres, genre],
    });
  };

  const processImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "warn");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => update({ heroImage: reader.result });
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => processImage(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processImage(e.dataTransfer.files[0]);
  };

  const quickRates = [500, 800, 1200, 2000];

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      {/* Toast */}
      {toast && <Toast {...toast} />}

      <div className="max-w-5xl mx-auto px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-white">My Portfolio</h1>
              {isDirty && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-md">
                  <AlertCircle className="w-3 h-3" /> Unsaved
                </span>
              )}
            </div>
            <p className="text-zinc-400">Manage your public profile and rates</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview((s) => !s)}
              className="hidden lg:flex items-center gap-2 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2.5 rounded-xl font-semibold transition"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>

            <button
              onClick={handleReset}
              disabled={!isDirty}
              className="flex items-center gap-2 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2.5 rounded-xl font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>

            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                isSaved
                  ? "bg-green-500 text-white shadow-green-500/25"
                  : "bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/25"
              }`}
            >
              {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {isSaved ? "Saved!" : "Save Profile"}
            </button>
          </div>
        </div>

        <div className={`grid gap-8 ${showPreview ? "lg:grid-cols-[1fr_360px]" : "grid-cols-1"}`}>
          {/* --- Editor column --- */}
          <div className="space-y-6">
            {/* Identity card */}
            <Section icon={ImageIcon} title="Identity" accent="purple">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Avatar with drag & drop */}
                <div className="relative shrink-0">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`relative w-28 h-28 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed transition-all ${
                      isDragging
                        ? "border-purple-500 bg-purple-500/10 scale-105"
                        : "border-zinc-700 bg-zinc-800"
                    }`}
                  >
                    {portfolio.heroImage ? (
                      <>
                        <img
                          src={portfolio.heroImage}
                          alt="Hero"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => update({ heroImage: null })}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white p-1 rounded-full transition"
                          aria-label="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center pointer-events-none">
                        <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-1" />
                        <span className="text-[10px] text-zinc-500 font-medium px-2">
                          {isDragging ? "Drop!" : "Drag or click"}
                        </span>
                      </div>
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
                    className="absolute -bottom-2 -right-2 bg-purple-500 hover:bg-purple-600 p-2 rounded-full border-2 border-black text-white transition"
                    aria-label="Upload image"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 w-full space-y-4">
                  <Field label="Stage Name" hint={`${portfolio.stageName.length}/40`}>
                    <input
                      type="text"
                      maxLength={40}
                      value={portfolio.stageName}
                      onChange={(e) => update({ stageName: e.target.value })}
                      className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                    />
                  </Field>

                  <Field
                    label="Hourly Rate (ZAR)"
                    icon={Banknote}
                    iconClass="text-green-400"
                  >
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">R</span>
                      <input
                        type="number"
                        min={0}
                        value={portfolio.hourlyRate}
                        onChange={(e) => update({ hourlyRate: e.target.value })}
                        className="w-full bg-black border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                      />
                    </div>
                    {/* Quick-pick chips */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {quickRates.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => update({ hourlyRate: rate })}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                            Number(portfolio.hourlyRate) === rate
                              ? "bg-green-500/15 text-green-400 border-green-500/30"
                              : "bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          R{rate}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
            </Section>

            {/* Bio */}
            <Section icon={Sparkles} title="Bio" accent="purple">
              <Field
                label="Tell clients who you are"
                hint={
                  <span className={bioOver ? "text-red-400" : bioRemaining < 40 ? "text-amber-400" : "text-zinc-500"}>
                    {bioRemaining} chars left
                  </span>
                }
              >
                <textarea
                  value={portfolio.bio}
                  onChange={(e) => update({ bio: e.target.value })}
                  className={`w-full bg-black border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 transition h-28 resize-none ${
                    bioOver
                      ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                      : "border-zinc-700 focus:border-purple-500 focus:ring-purple-500/20"
                  }`}
                />
                {bioOver && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Bio is too long
                  </p>
                )}
              </Field>
            </Section>

            {/* Genres */}
            <Section icon={Music} title="My Genres" accent="purple">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-zinc-500">
                  Pick up to <span className="text-zinc-300 font-bold">{MAX_GENRES}</span>
                </p>
                <span className={`text-xs font-bold ${
                  portfolio.genres.length >= MIN_GENRES && portfolio.genres.length <= MAX_GENRES
                    ? "text-zinc-500"
                    : "text-amber-400"
                }`}>
                  {portfolio.genres.length}/{MAX_GENRES} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_GENRES.map((genre) => {
                  const active = portfolio.genres.includes(genre);
                  const disabled = !active && portfolio.genres.length >= MAX_GENRES;
                  return (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      disabled={disabled}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        active
                          ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25 scale-105"
                          : disabled
                          ? "bg-black text-zinc-600 border border-zinc-800 cursor-not-allowed"
                          : "bg-black text-zinc-400 border border-zinc-700 hover:border-purple-500/50 hover:text-white"
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
              {portfolio.genres.length < MIN_GENRES && (
                <p className="text-xs text-amber-400 mt-3 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Select at least one genre
                </p>
              )}
            </Section>
          </div>

          {/* --- Live preview --- */}
          {showPreview && (
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Eye className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Live Preview
                </span>
              </div>
              <ProfilePreview portfolio={portfolio} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Section({ icon: Icon, title, accent = "purple", children }) {
  const accentMap = {
    purple: "text-purple-400",
    green: "text-green-400",
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5 transition-colors hover:border-zinc-700/80">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${accentMap[accent]}`} />
        <h2 className="text-white font-bold text-lg">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, icon: Icon, iconClass = "text-zinc-400", hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-zinc-400 text-sm flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${iconClass}`} />}
          {label}
        </label>
        {hint && <span className="text-xs">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ProfilePreview({ portfolio }) {
  const rate = Number(portfolio.hourlyRate) || 0;
  return (
    <div className="bg-gradient-to-b from-purple-900/30 to-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
      {/* Hero image */}
      <div className="relative h-40 bg-gradient-to-br from-purple-600/40 via-purple-900/20 to-black">
        {portfolio.heroImage && (
          <img
            src={portfolio.heroImage}
            alt="Hero"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="px-5 pb-5 -mt-8 relative">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-zinc-900 overflow-hidden flex items-center justify-center">
          {portfolio.heroImage ? (
            <img src={portfolio.heroImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-6 h-6 text-zinc-500" />
          )}
        </div>

        <h3 className="text-lg font-bold text-white mt-3">
          {portfolio.stageName || "Your Stage Name"}
        </h3>
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mt-0.5">
          DJ · Performer
        </p>

        <p className="text-sm text-zinc-400 mt-3 line-clamp-3 italic">
          "{portfolio.bio || "Your bio will appear here..."}"
        </p>

        {/* Genres */}
        {portfolio.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {portfolio.genres.map((g) => (
              <span
                key={g}
                className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/20 px-2 py-1 rounded-md"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Rate */}
        <div className="mt-5 flex items-end justify-between border-t border-zinc-800 pt-4">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
              Starting at
            </p>
            <p className="text-2xl font-bold text-white">
              R{rate.toLocaleString()}
              <span className="text-sm text-zinc-500 font-medium"> /hr</span>
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" /> Available
          </div>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, tone }) {
  const tones = {
    success: "bg-green-500/10 border-green-500/30 text-green-400",
    warn: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    neutral: "bg-zinc-800 border-zinc-700 text-zinc-300",
  };
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl ${tones[tone]}`}>
        <span className="text-sm font-semibold">{message}</span>
      </div>
    </div>
  );
}