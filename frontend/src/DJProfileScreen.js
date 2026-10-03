import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft, Star, MapPin, ShieldCheck, Heart, Loader2, Calendar, Clock,
  Users, Award, Headphones, Zap, Trophy, CheckCircle, AlertCircle, Info,
  ChevronUp, Edit3, Share2, X, Send, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { getDJById } from "./services/djService";
import { useUser } from "./UserContext/ThisUserContext";

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

const API_BASE_URL = "https://gigza-testing-11.onrender.com/api";
const FAVORITES_KEY = "gigza:favorites"; // same key the home screen uses
const DEFAULT_PAGINATION = { page: 1, limit: 10, total: 0, total_pages: 0 };

const btnPrimary =
  "rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium " +
  "shadow-lg shadow-purple-900/30 hover:from-purple-500 hover:to-fuchsia-500 transition " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const btnGhost =
  "rounded-lg border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 hover:border-white/20 transition " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400";

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder:text-zinc-600 " +
  "focus:outline-none focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/20 transition [color-scheme:dark]";

// Full class strings so Tailwind keeps them in production builds
const STAT_ICON_COLORS = {
  yellow: "text-yellow-400",
  blue: "text-blue-400",
  purple: "text-purple-400",
  green: "text-green-400",
};

const safeNumber = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

const formatPrice = (price) => `R${Math.round(safeNumber(price, 0)).toLocaleString("en-ZA")}`;

const placeholder = (name) =>
  `https://placehold.co/1200x800/18181b/a1a1aa?text=${encodeURIComponent(name || "DJ")}`;

const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toList = (value) => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(",");
  return list.map((s) => String(s).trim()).filter(Boolean);
};

const readFavorites = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const fetchWithAuth = async (url, options = {}, token) => {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });

  let data;
  const text = await response.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { message: text || "Invalid response from server" };
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
  }
  return data;
};

// Closes on Escape and locks page scroll while a modal is open
function useModalBehavior(onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
}

/* ------------------------------------------------------------------ */
/* Review modal (owns its own form state so typing never re-renders    */
/* the whole profile)                                                  */
/* ------------------------------------------------------------------ */

const RATING_LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];

function ReviewModal({ djName, onClose, onSubmit, onLogin }) {
  useModalBehavior(onClose);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const trimmed = text.trim();
  const canSubmit = rating > 0 && trimmed.length >= 10 && !submitting;
  const shown = hoverRating || rating;

  const submit = async () => {
    setFormError(null);
    setNeedsLogin(false);
    setSubmitting(true);
    const result = await onSubmit(rating, trimmed);
    setSubmitting(false);
    if (result.ok) {
      onClose();
    } else {
      setFormError(result.message);
      setNeedsLogin(!!result.needsLogin);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
    >
      <motion.div
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 16 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="review-title" className="text-xl font-bold">Review {djName}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-zinc-400 text-sm mb-2">Your rating</p>
            <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                  aria-pressed={star === rating}
                  className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 rounded"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= shown ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"
                    }`}
                  />
                </button>
              ))}
              {shown > 0 && <span className="text-zinc-400 text-sm ml-2">{RATING_LABELS[shown - 1]}</span>}
            </div>
          </div>

          <div>
            <label htmlFor="review-text" className="text-zinc-400 text-sm block mb-2">Your review</label>
            <textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your experience with this DJ"
              rows={4}
              className={`${inputClass} resize-none`}
            />
            <p className={`text-xs mt-1.5 ${trimmed.length > 0 && trimmed.length < 10 ? "text-yellow-400" : "text-zinc-500"}`}>
              {trimmed.length < 10 ? `At least 10 characters (${trimmed.length}/10)` : "Looks good"}
            </p>
          </div>

          {formError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3" role="alert">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-red-400">{formError}</p>
                {needsLogin && (
                  <button onClick={onLogin} className="text-purple-300 hover:text-purple-200 underline mt-1">
                    Log in
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            onClick={submit}
            disabled={!canSubmit}
            className={`w-full py-3 text-sm flex items-center justify-center gap-2 ${
              canSubmit ? btnPrimary : "rounded-lg bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Submit review
              </>
            )}
          </button>
          <p className="text-center text-xs text-zinc-500">Reviews may be checked by a moderator before they appear.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export function DJProfileScreen() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken, isAuthenticated } = useUser();

  const [dj, setDj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Booking widget (date can arrive from the home screen as ?date=YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(searchParams.get("date") || "");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingDuration, setBookingDuration] = useState(2);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewPagination, setReviewPagination] = useState(DEFAULT_PAGINATION);
  const [reviewError, setReviewError] = useState(null);
  const [reviewsAuthIssue, setReviewsAuthIssue] = useState(null); // null | "login" | "expired"
  const [showReviewModal, setShowReviewModal] = useState(false);

  // UI
  const [notice, setNotice] = useState(null);
  const [showTop, setShowTop] = useState(false);
  const bookingRef = useRef(null);

  /* ----------------------------- Data ----------------------------- */

  // Reviews for this DJ. The backend requires auth on this route, so we only call it with a token.
  // page > 1 appends to the current list; page 1 replaces it.
  const fetchReviews = async (djId, page = 1) => {
    try {
      setReviewsLoading(true);
      setReviewError(null);

      const token = getToken();

      // TEMP DIAGNOSTIC (kept from your version): tells us whether a 401 means "logged out" or "valid session rejected".
      // It logs part of the token, so remove it before shipping.
      console.log(
        "🔎 reviews auth check — isAuthenticated:", isAuthenticated,
        "| token:", token ? token.slice(0, 20) + "..." : null
      );

      if (!token) {
        setReviews([]);
        setReviewPagination(DEFAULT_PAGINATION);
        setReviewsAuthIssue("login");
        return;
      }
      setReviewsAuthIssue(null);

      const url = `${API_BASE_URL}/getReviews?dj_id=${djId}&page=${page}&limit=10`;
      const data = await fetchWithAuth(url, {}, token);

      if (data.success) {
        const incoming = data.reviews || [];
        setReviews((prev) => (page > 1 ? [...prev, ...incoming] : incoming));
        setReviewPagination(data.pagination || DEFAULT_PAGINATION);
      } else {
        setReviewError(data.message || "Failed to load reviews");
      }
    } catch (err) {
      if (/401|Authentication required/i.test(err.message || "")) {
        console.warn("⚠️ Had a token but /getReviews still 401'd. Token may be expired.");
        setReviews([]);
        setReviewsAuthIssue("expired");
      } else {
        console.error("Error fetching reviews:", err);
        setReviewError(err.message || "Failed to load reviews");
      }
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchDJDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDJById(id);

        if (data.success && data.dj) {
          // getDJById doesn't run djService's normalizer, so make sure both id fields exist.
          const resolvedId = data.dj.dj_id || data.dj.id || id;
          setDj({
            ...data.dj,
            id: resolvedId,
            dj_id: resolvedId,
            rating: safeNumber(data.dj.rating, 0),
            price: safeNumber(data.dj.price, 150),
            review_count: safeNumber(data.dj.review_count, 0),
            events_done: safeNumber(data.dj.events_done, 0),
            // No invented defaults: these only show when the API provides them
            response_rate: data.dj.response_rate != null ? safeNumber(data.dj.response_rate, 0) : null,
            response_time: data.dj.response_time || null,
          });
          await fetchReviews(resolvedId);
        } else {
          setError("DJ not found");
        }
      } catch (err) {
        console.error("Error fetching DJ details:", err);
        setError("Failed to load DJ profile");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDJDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Favorite state is shared with the home screen through localStorage
  useEffect(() => {
    if (!dj) return;
    setIsFavorite(readFavorites().some((f) => String(f) === String(dj.id)));
  }, [dj?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show the scroll-to-top button only after scrolling
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-dismiss the toast
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(t);
  }, [notice]);

  /* ---------------------------- Actions ---------------------------- */

  const toggleFavorite = () => {
    const favs = readFavorites();
    const has = favs.some((f) => String(f) === String(dj.id));
    const next = has ? favs.filter((f) => String(f) !== String(dj.id)) : [...favs, dj.id];
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable, keep in memory only */
    }
    setIsFavorite(!has);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${dj.name} on Gigza`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNotice("Link copied to clipboard");
    } catch {
      /* user cancelled, or clipboard blocked */
    }
  };

  // Carry date/time/duration to the booking screen (as ?date= and as router state)
  const handleBooking = () => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    const params = new URLSearchParams();
    if (selectedDate) params.set("date", selectedDate);
    const qs = params.toString();

    navigate(`/book/${dj.dj_id || dj.id}${qs ? `?${qs}` : ""}`, {
      state: {
        date: selectedDate,
        time: selectedTime,
        duration: bookingDuration,
        djName: dj.name,
        pricePerHour: dj.price,
      },
    });
  };

  // Returns { ok, message?, needsLogin? } so the modal can show errors inline
  const submitReview = async (rating, text) => {
    const token = getToken();
    if (!token) return { ok: false, needsLogin: true, message: "Please log in to submit a review." };

    const djId = dj.dj_id || dj.id || id;

    try {
      const data = await fetchWithAuth(
        `${API_BASE_URL}/create-review`,
        {
          method: "POST",
          body: JSON.stringify({
            dj_id: parseInt(djId),
            review_text: text,
            rating_value: rating,
          }),
        },
        token
      );

      if (!data.success) return { ok: false, message: data.message || "Failed to submit review." };

      // Refetch the DJ for the authoritative rating and count instead of recomputing locally
      try {
        const fresh = await getDJById(djId);
        if (fresh.success && fresh.dj) {
          setDj((prev) => ({
            ...prev,
            ...fresh.dj,
            id: prev.id,
            dj_id: prev.dj_id,
            rating: safeNumber(fresh.dj.rating, prev.rating),
            review_count: safeNumber(fresh.dj.review_count, prev.review_count),
          }));
        }
      } catch (refreshErr) {
        console.error("Error refreshing DJ after review:", refreshErr);
      }

      await fetchReviews(djId);
      setNotice("Review submitted. It will appear after moderation.");
      return { ok: true };
    } catch (err) {
      console.error("Error submitting review:", err);
      return { ok: false, message: err.message || "Failed to submit review. Please try again." };
    }
  };

  const loadMoreReviews = () => {
    if (reviewPagination.page < reviewPagination.total_pages) {
      fetchReviews(dj.dj_id || id, reviewPagination.page + 1);
    }
  };

  const closeReviewModal = () => setShowReviewModal(false);

  const scrollToBooking = () => bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  /* ------------------------ Loading / error ------------------------ */

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 animate-pulse">
        <div className="h-[42vh] bg-zinc-900" />
        <div className="max-w-6xl mx-auto px-5 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-zinc-900 rounded-2xl" />
              ))}
            </div>
            <div className="h-48 bg-zinc-900 rounded-2xl" />
          </div>
          <div className="h-96 bg-zinc-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !dj) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md text-center">
          <div className="inline-flex p-4 bg-red-500/10 rounded-2xl mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Profile not found</h1>
          <p className="text-zinc-400 text-sm mb-6">
            {error || "The DJ you're looking for doesn't exist or has been removed."}
          </p>
          <button onClick={() => navigate(-1)} className={`${btnGhost} inline-flex items-center gap-2 px-6 py-2.5 text-sm`}>
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------- Derived ---------------------------- */

  // Assumes the API may return `available` or `is_available`. The badge only shows when it is true.
  const availableNow = dj.available === true || dj.is_available === true;
  const skills = toList(dj.skills);
  const equipment = toList(dj.equipment);

  const stats = [
    { icon: Trophy, label: "Rating", value: `${dj.rating.toFixed(1)} ★`, color: "yellow" },
    dj.response_time && { icon: Clock, label: "Replies in", value: dj.response_time, color: "blue" },
    dj.events_done > 0 && { icon: Award, label: "Events", value: `${dj.events_done}+`, color: "purple" },
    { icon: Users, label: "Reviews", value: `${dj.review_count}`, color: "green" },
  ].filter(Boolean);

  const tabs = [
    { id: "overview", icon: Info, label: "Overview" },
    { id: "reviews", icon: Star, label: `Reviews (${dj.review_count})` },
    equipment.length > 0 && { id: "equipment", icon: Headphones, label: "Equipment" },
  ].filter(Boolean);

  const total = dj.price * bookingDuration;

  /* ------------------------------ Render ------------------------------ */

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-zinc-950 text-white pb-28 lg:pb-12">
        {/* Cover */}
        <div className="relative h-[42vh] md:h-[48vh] overflow-hidden bg-zinc-900">
          <img
            src={dj.image || placeholder(dj.name)}
            alt={dj.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = placeholder(dj.name);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/20" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="bg-black/50 backdrop-blur-md border border-white/10 p-2.5 rounded-full hover:bg-black/70 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                aria-label="Share this profile"
                className="bg-black/50 backdrop-blur-md border border-white/10 p-2.5 rounded-full hover:bg-black/70 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={toggleFavorite}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={isFavorite}
                className="bg-black/50 backdrop-blur-md border border-white/10 p-2.5 rounded-full hover:bg-black/70 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              >
                <Heart className={`w-5 h-5 transition ${isFavorite ? "fill-red-500 text-red-500" : "text-white"}`} />
              </button>
            </div>
          </div>

          {/* Name and quick facts */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-8 md:pb-10">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-full bg-purple-500/20 backdrop-blur text-purple-200 px-3 py-1 text-xs font-medium border border-purple-400/20">
                  {dj.genre || "Electronic"}
                </span>
                {dj.verified && (
                  <span className="rounded-full bg-blue-600/90 px-3 py-1 text-xs font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
                {availableNow && (
                  <span className="rounded-full bg-green-500/20 backdrop-blur text-green-300 px-3 py-1 text-xs font-medium flex items-center gap-1.5 border border-green-400/20">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping motion-reduce:animate-none" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                    </span>
                    Available now
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">{dj.name}</h1>

              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                {dj.location && (
                  <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur rounded-full px-3 py-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    {dj.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur rounded-full px-3 py-1.5">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-medium">{dj.rating.toFixed(1)}</span>
                  <span className="text-zinc-400">({dj.review_count} reviews)</span>
                </span>
                {dj.events_done > 0 && (
                  <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur rounded-full px-3 py-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    {dj.events_done}+ events
                  </span>
                )}
                {dj.response_rate != null && (
                  <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur rounded-full px-3 py-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    {dj.response_rate}% response
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-5 mt-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {/* Stats */}
              <div className={`grid grid-cols-2 ${stats.length > 3 ? "md:grid-cols-4" : "md:grid-cols-3"} gap-3`}>
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-zinc-900 border border-white/10 rounded-2xl p-4 text-center"
                  >
                    <stat.icon className={`w-4 h-4 mx-auto mb-1.5 ${STAT_ICON_COLORS[stat.color]}`} />
                    <p className="text-white font-semibold">{stat.value}</p>
                    <p className="text-zinc-500 text-xs">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${
                        active
                          ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium"
                          : "border border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-6"
                  >
                    <div>
                      <h2 className="font-semibold mb-2.5 flex items-center gap-2">
                        <Info className="w-4 h-4 text-purple-400" />
                        About
                      </h2>
                      <p className="text-zinc-300 text-sm leading-relaxed">
                        {dj.bio || "This DJ hasn't added a bio yet."}
                      </p>
                    </div>

                    {skills.length > 0 && (
                      <div>
                        <h2 className="font-semibold mb-2.5 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                          Genres and skills
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-white/5 border border-white/10 text-zinc-300 px-3 py-1 text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {dj.tagline && (
                      <blockquote className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                        <p className="text-purple-200 text-sm italic">“{dj.tagline}”</p>
                      </blockquote>
                    )}
                  </motion.div>
                )}

                {activeTab === "reviews" && (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-zinc-900 border border-white/10 rounded-2xl p-6"
                  >
                    <div className="mb-5">
                      <h2 className="font-semibold">Reviews</h2>
                      <div className="flex items-center gap-2 text-sm mt-0.5">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-medium">{dj.rating.toFixed(1)}</span>
                        <span className="text-zinc-500">from {dj.review_count} reviews</span>
                      </div>
                    </div>

                    {reviewsLoading && reviews.length === 0 ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                      </div>
                    ) : reviewsAuthIssue ? (
                      <div className="text-center py-8">
                        <Star className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-300 text-sm">
                          {reviewsAuthIssue === "expired"
                            ? "Your session has expired. Log in again to read reviews."
                            : "Log in to read what other clients said."}
                        </p>
                        <Link to="/login" className={`${btnPrimary} inline-block px-5 py-2 text-sm mt-4`}>
                          Log in
                        </Link>
                      </div>
                    ) : reviewError ? (
                      <div className="text-center py-8" role="alert">
                        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                        <p className="text-red-400 text-sm mb-4">{reviewError}</p>
                        <button onClick={() => fetchReviews(dj.dj_id || id)} className={`${btnGhost} px-5 py-2 text-sm`}>
                          Try again
                        </button>
                      </div>
                    ) : reviews.length > 0 ? (
                      <div>
                        {reviews.map((review, i) => (
                          <div key={review.review_id || i} className="border-b border-white/10 last:border-0 py-4 first:pt-0">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                                {review.username ? review.username.substring(0, 2).toUpperCase() : "U"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-white font-medium text-sm">{review.username || "Anonymous"}</p>
                                  <span className="text-zinc-500 text-xs">
                                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : "Recently"}
                                  </span>
                                  <div className="flex items-center gap-0.5 ml-auto" aria-label={`${review.rating_value || 0} out of 5 stars`}>
                                    {[...Array(5)].map((_, j) => (
                                      <Star
                                        key={j}
                                        className={`w-3 h-3 ${
                                          j < (review.rating_value || 0) ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-zinc-300 text-sm mt-1.5 leading-relaxed">{review.review_text}</p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {reviewPagination.page < reviewPagination.total_pages && (
                          <button
                            onClick={loadMoreReviews}
                            disabled={reviewsLoading}
                            className={`${btnGhost} w-full mt-4 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60`}
                          >
                            {reviewsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Load more reviews ({reviewPagination.page} of {reviewPagination.total_pages})
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Star className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-300 text-sm">No reviews yet</p>
                        <p className="text-zinc-500 text-xs mt-1">Be the first to review this DJ.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "equipment" && equipment.length > 0 && (
                  <motion.div
                    key="equipment"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-zinc-900 border border-white/10 rounded-2xl p-6"
                  >
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-purple-400" />
                      Equipment and services
                    </h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {equipment.map((item) => (
                        <li key={item} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl p-3">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          <span className="text-zinc-300 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right column: booking */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6 space-y-4">
                <div ref={bookingRef} className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-zinc-500 text-xs">Rate</p>
                      <p className="mt-0.5">
                        <span className="text-3xl font-bold">{formatPrice(dj.price)}</span>
                        <span className="text-zinc-500 text-sm"> / hour</span>
                      </p>
                    </div>
                    {availableNow && (
                      <span className="rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-green-400 text-xs font-medium">
                        Available now
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="booking-date" className="text-zinc-400 text-xs mb-1.5 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        Event date
                      </label>
                      <input
                        id="booking-date"
                        type="date"
                        min={todayISO()}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label htmlFor="booking-time" className="text-zinc-400 text-xs mb-1.5 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Start time
                      </label>
                      <input
                        id="booking-time"
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <p className="text-zinc-400 text-xs mb-1.5 font-medium">Duration</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setBookingDuration((d) => Math.max(1, d - 1))}
                          disabled={bookingDuration <= 1}
                          aria-label="Decrease duration"
                          className={`${btnGhost} w-9 h-9 text-lg leading-none disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          −
                        </button>
                        <span className="text-white font-semibold text-xl w-8 text-center" aria-live="polite">
                          {bookingDuration}
                        </span>
                        <button
                          onClick={() => setBookingDuration((d) => Math.min(8, d + 1))}
                          disabled={bookingDuration >= 8}
                          aria-label="Increase duration"
                          className={`${btnGhost} w-9 h-9 text-lg leading-none disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          +
                        </button>
                        <span className="text-zinc-400 text-sm">{bookingDuration === 1 ? "hour" : "hours"}</span>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">{formatPrice(dj.price)} × {bookingDuration}h</span>
                        <span className="text-white">{formatPrice(total)}</span>
                      </div>
                      <div className="flex justify-between items-baseline border-t border-white/10 pt-3">
                        <span className="text-white font-medium">Estimated total</span>
                        <span className="text-white font-bold text-2xl">{formatPrice(total)}</span>
                      </div>
                    </div>

                    <button onClick={handleBooking} className={`${btnPrimary} w-full py-3 text-sm`}>
                      Book now
                    </button>
                    <p className="text-center text-xs text-zinc-500">You'll confirm the details on the next step.</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowReviewModal(true)}
                  className={`${btnGhost} w-full py-3 text-sm flex items-center justify-center gap-2`}
                >
                  <Edit3 className="w-4 h-4" />
                  Write a review
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile booking bar */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-zinc-950/90 backdrop-blur-md px-5 py-3 flex items-center justify-between gap-4">
          <div>
            <span className="text-xl font-bold">{formatPrice(dj.price)}</span>
            <span className="text-zinc-500 text-sm"> / hour</span>
          </div>
          <button onClick={scrollToBooking} className={`${btnPrimary} px-6 py-2.5 text-sm`}>
            Book now
          </button>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              role="status"
              className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] flex items-center gap-2 bg-zinc-900 border border-white/15 rounded-full pl-4 pr-2 py-2 shadow-2xl shadow-black/60"
            >
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-sm">{notice}</span>
              <button
                onClick={() => setNotice(null)}
                aria-label="Dismiss"
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review modal */}
        <AnimatePresence>
          {showReviewModal && (
            <ReviewModal
              djName={dj.name}
              onClose={closeReviewModal}
              onSubmit={submitReview}
              onLogin={() => navigate("/login")}
            />
          )}
        </AnimatePresence>

        {/* Scroll to top */}
        <AnimatePresence>
          {showTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Scroll to top"
              className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-30 bg-zinc-900/90 backdrop-blur border border-white/15 hover:bg-zinc-800 transition p-3 rounded-full shadow-lg"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
