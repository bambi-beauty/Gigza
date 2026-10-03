import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera, Music, Banknote, Pencil, CalendarCheck, Wallet, LogOut,
  Share2, Check, Star, Clock, TrendingUp, ShieldCheck,
  Sparkles, AlertCircle, ChevronRight, X, Zap, Award, Eye,
} from "lucide-react";
import {
  slugify, loadReviews, ensureSeedReviews, summarizeReviews, formatZAR, timeAgo,
} from "../src/lib/djProfileUtils";

const DEFAULT_PORTFOLIO = {
  stageName: "",
  hourlyRate: 0,
  bio: "",
  genres: [],
  heroImage: null,
};

const MEMBER_SINCE_KEY = "gigzaMemberSince";

// ---------- sparkline ----------
function Sparkline({ data, width = 160, height = 44, stroke = "#a855f7" }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const step = width / (data.length - 1 || 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - (v / max) * (height - 8) - 4;
    return [x, y];
  });
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path d={linePath} stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.length > 0 && (
        <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3" fill={stroke} />
      )}
    </svg>
  );
}

// ---------- helpers ----------
const buildSparkline = (bookings, months = 6) => {
  const now = new Date();
  const buckets = Array(months).fill(0);
  const startMonth = now.getMonth() - (months - 1);

  bookings.forEach((b) => {
    const d = new Date(b.date);
    if (isNaN(d)) return;
    const offset =
      (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - startMonth);
    if (offset >= 0 && offset < months) {
      buckets[offset] += Number(b.totalPaid) || 0;
    }
  });

  return buckets;
};

// ---------- main ----------
export function DJProfileScreen() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [memberSince, setMemberSince] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    let savedPortfolio = null;
    try {
      savedPortfolio = JSON.parse(localStorage.getItem("gigzaDJPortfolio"));
      if (savedPortfolio) {
        setPortfolio({ ...DEFAULT_PORTFOLIO, ...savedPortfolio });
      }
    } catch {
      /* corrupted data: fall back to defaults */
    }

    try {
      setBookings(JSON.parse(localStorage.getItem("gigzaBookings")) || []);
    } catch {
      setBookings([]);
    }

    // Reviews (per slug)
    const slug = slugify(savedPortfolio?.stageName || "me");
    ensureSeedReviews(slug, savedPortfolio?.stageName);
    setReviews(loadReviews(slug));

    // Member since — set once
    let since = localStorage.getItem(MEMBER_SINCE_KEY);
    if (!since) {
      since = String(Date.now());
      localStorage.setItem(MEMBER_SINCE_KEY, since);
    }
    setMemberSince(Number(since));
  }, []);

  // ---------- derived ----------
  const now = Date.now();

  const {
    totalEarned,
    upcomingCount,
    completedCount,
    thisMonthEarned,
    sparklineData,
    nextGig,
  } = useMemo(() => {
    const upcoming = bookings.filter((b) => {
      const d = new Date(b.date);
      return !isNaN(d) && d.getTime() >= now - 86400000;
    });
    const completed = bookings.filter((b) => {
      const d = new Date(b.date);
      return !isNaN(d) && d.getTime() < now - 86400000;
    });

    const totalEarned = bookings.reduce(
      (s, b) => s + (Number(b.totalPaid) || 0),
      0
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonthEarned = bookings
      .filter((b) => {
        const d = new Date(b.date);
        return !isNaN(d) && d.getTime() >= startOfMonth.getTime();
      })
      .reduce((s, b) => s + (Number(b.totalPaid) || 0), 0);

    const sortedUpcoming = [...upcoming].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const nextGig = sortedUpcoming[0] || null;

    return {
      totalEarned,
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      thisMonthEarned,
      sparklineData: buildSparkline(bookings, 6),
      nextGig,
    };
  }, [bookings, now]);

  const reviewStats = useMemo(() => summarizeReviews(reviews), [reviews]);

  // ---------- profile completeness ----------
  const checks = [
    { key: "stageName", label: "Stage name", done: !!portfolio.stageName?.trim(), to: "/dj-portfolio" },
    { key: "hourlyRate", label: "Hourly rate", done: Number(portfolio.hourlyRate) > 0, to: "/dj-portfolio" },
    { key: "bio", label: "Bio (30+ chars)", done: (portfolio.bio?.trim().length || 0) >= 30, to: "/dj-portfolio" },
    { key: "genres", label: "At least 1 genre", done: portfolio.genres.length >= 1, to: "/dj-portfolio" },
    { key: "heroImage", label: "Hero photo", done: !!portfolio.heroImage, to: "/dj-portfolio" },
  ];
  const completedChecks = checks.filter((c) => c.done).length;
  const profilePct = Math.round((completedChecks / checks.length) * 100);
  const nextStep = checks.find((c) => !c.done);
  const profileComplete = profilePct === 100;

  const profileSlug = slugify(portfolio.stageName || "me");

  // ---------- actions ----------
  const handleShare = async () => {
    const url = `${window.location.origin}/dj/${profileSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const doLogout = () => {
    [
      "token", "isAuthenticated", "userType", "isNewDJ",
      "profileCompleted", "djApplicationSubmitted", "user",
    ].forEach((key) => localStorage.removeItem(key));
    navigate("/dj-login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* ===== HEADER ===== */}
      <div className="relative bg-gradient-to-b from-purple-900/50 via-purple-950/20 to-black px-6 pt-10 pb-8 border-b border-zinc-800 overflow-hidden">
        {portfolio.heroImage && (
          <div
            className="absolute inset-0 opacity-20 blur-3xl scale-110 pointer-events-none"
            style={{
              backgroundImage: `url(${portfolio.heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}

        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-zinc-800 rounded-3xl flex items-center justify-center overflow-hidden border-2 border-zinc-700 ring-4 ring-purple-500/10">
                {portfolio.heroImage ? (
                  <img
                    src={portfolio.heroImage}
                    alt={portfolio.stageName || "DJ"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-8 h-8 text-zinc-500" />
                )}
              </div>
              {profileComplete && (
                <div
                  className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-black rounded-full p-1.5"
                  title="Profile complete"
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Name + quick info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                  {portfolio.stageName || "Add your stage name"}
                </h1>
                {profileComplete && (
                  <span title="Verified profile">
                    <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
                  </span>
                )}
              </div>

              <p className="text-purple-400 font-bold mt-1">
                {portfolio.hourlyRate
                  ? `${formatZAR(portfolio.hourlyRate)} / hour`
                  : "Set your hourly rate"}
              </p>

              {/* Identity strip */}
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500 flex-wrap">
                {memberSince && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Member {timeAgo(memberSince).replace("ago", "").trim()}
                  </span>
                )}
                {completedCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3" /> {completedCount} gig{completedCount === 1 ? "" : "s"} played
                  </span>
                )}
                {profileComplete && (
                  <span className="flex items-center gap-1 text-green-400">
                    <Zap className="w-3 h-3" /> Available for bookings
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4 flex-wrap">
                <Link
                  to="/dj-portfolio"
                  className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-purple-500/25"
                >
                  <Pencil className="w-4 h-4" /> Edit profile
                </Link>
                <Link
                  to={`/dj/${profileSlug}`}
                  className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition"
                >
                  <Eye className="w-4 h-4" /> Preview
                </Link>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" /> Share
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 mt-6 space-y-5">
        {/* ===== PROFILE COMPLETENESS ===== */}
        {!profileComplete && (
          <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-3xl p-5">
            <div className="flex items-start gap-4">
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3f3f46" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(profilePct / 100) * 97.4} 97.4`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{profilePct}%</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Finish your profile
                </h3>
                <p className="text-sm text-purple-200/80 mt-1">
                  {nextStep?.label} is the next thing clients notice.
                </p>
                <Link
                  to={nextStep?.to || "/dj-portfolio"}
                  className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-purple-400 hover:text-purple-300"
                >
                  {nextStep?.label} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-purple-500/15 flex flex-wrap gap-2">
              {checks.map((c) => (
                <span
                  key={c.key}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                    c.done
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-black/40 text-zinc-500 border-zinc-800"
                  }`}
                >
                  {c.done && <Check className="w-3 h-3" strokeWidth={3} />}
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={CalendarCheck}
            tone="purple"
            label="Upcoming gigs"
            value={upcomingCount}
            sub={
              nextGig
                ? `Next: ${new Date(nextGig.date).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "short",
                  })}`
                : "Nothing scheduled"
            }
          />
          <StatCard
            icon={Wallet}
            tone="green"
            label="Total earned"
            value={formatZAR(totalEarned)}
            sub={
              thisMonthEarned > 0
                ? `+${formatZAR(thisMonthEarned)} this month`
                : "No earnings this month"
            }
          />
        </div>

        {/* ===== EARNINGS SPARKLINE ===== */}
        {sparklineData.some((v) => v > 0) && (
          <Link
            to="/dashboard"
            className="block bg-zinc-900 border border-zinc-800 hover:border-purple-500/40 rounded-3xl p-5 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  Last 6 months
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition" />
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-bold text-white">
                  {formatZAR(sparklineData.reduce((a, b) => a + b, 0))}
                </p>
                <p className="text-xs text-zinc-500 mt-1">View financial details</p>
              </div>
              <div className="shrink-0">
                <Sparkline data={sparklineData} width={160} height={44} />
              </div>
            </div>
          </Link>
        )}

        {/* ===== REVIEWS ===== */}
        <Link
          to={`/dj/${profileSlug}`}
          className="block bg-zinc-900 border border-zinc-800 hover:border-purple-500/40 rounded-3xl p-5 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/15 p-2.5 rounded-xl">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-bold leading-tight">Reviews</p>
                <p className="text-xs text-zinc-500">
                  {reviewStats.count > 0
                    ? `${reviewStats.average.toFixed(1)} ★ from ${reviewStats.count} client${reviewStats.count === 1 ? "" : "s"}`
                    : "No reviews yet"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-purple-400 transition" />
          </div>
        </Link>

        {/* ===== ABOUT ===== */}
        <Section title="About">
          {portfolio.bio ? (
            <p className="text-zinc-300 leading-relaxed">{portfolio.bio}</p>
          ) : (
            <EmptyRow
              text="No bio yet. Tell clients what your sets feel like."
              cta="Write a bio"
              to="/dj-portfolio"
            />
          )}
        </Section>

        {/* ===== GENRES ===== */}
        <Section
          title="Genres"
          icon={Music}
          action={
            portfolio.genres.length > 0
              ? { label: "Edit", to: "/dj-portfolio" }
              : null
          }
        >
          {portfolio.genres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {portfolio.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-purple-500/15 text-purple-300 border border-purple-500/25"
                >
                  {genre}
                </span>
              ))}
            </div>
          ) : (
            <EmptyRow
              text="No genres selected yet."
              cta="Pick genres"
              to="/dj-portfolio"
            />
          )}
        </Section>

        {/* ===== RATE ===== */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/15 p-2.5 rounded-xl">
              <Banknote className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white font-bold leading-tight">Hourly rate</p>
              <p className="text-xs text-zinc-500">Visible to clients browsing you</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-white font-bold text-lg block">
              {portfolio.hourlyRate ? formatZAR(portfolio.hourlyRate) : "Not set"}
            </span>
            {portfolio.hourlyRate && (
              <Link
                to="/dj-portfolio"
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                Change
              </Link>
            )}
          </div>
        </div>

        {/* ===== LOGOUT ===== */}
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 mt-4"
        >
          <LogOut className="w-5 h-5" /> Log out
        </button>

        <p className="text-center text-xs text-zinc-600 pt-2">
          GigZa ·{" "}
          {memberSince
            ? `Joined ${new Date(memberSince).toLocaleDateString("en-ZA", {
                month: "long",
                year: "numeric",
              })}`
            : ""}
        </p>
      </div>

      {/* ===== LOGOUT CONFIRM SHEET ===== */}
      {confirmLogout && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="bg-zinc-900 border-t sm:border border-zinc-800 sm:rounded-3xl rounded-t-3xl w-full sm:max-w-sm p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Log out of GigZa?</h3>
            <p className="text-sm text-zinc-400 mb-6">
              You'll need to sign in again to manage gigs and payouts.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={doLogout}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition shadow-lg shadow-red-500/25"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- subcomponents ----------
function StatCard({ icon: Icon, tone, label, value, sub }) {
  const tones = {
    purple: "bg-purple-500/15 text-purple-400",
    green: "bg-green-500/15 text-green-400",
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 transition-colors hover:border-zinc-700">
      <div className={`${tones[tone]} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-1">{label}</p>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-2 truncate">{sub}</p>}
    </div>
  );
}

function Section({ title, icon: Icon, action, children }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-purple-400" />}
          {title}
        </h2>
        {action && (
          <Link
            to={action.to}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
          >
            {action.label} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ text, cta, to }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-black/40 border border-dashed border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center gap-3 min-w-0">
        <AlertCircle className="w-4 h-4 text-zinc-600 shrink-0" />
        <p className="text-sm text-zinc-500 truncate">{text}</p>
      </div>
      {cta && (
        <Link
          to={to}
          className="text-xs font-bold text-purple-400 hover:text-purple-300 whitespace-nowrap shrink-0"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}