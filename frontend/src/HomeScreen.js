// src/HomeScreen.js
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Calendar, MapPin, Filter, Star, ShieldCheck, LogOut,
  User, Zap, ChevronDown, Music, Headphones, Clock,
  TrendingUp, Briefcase, X, Heart, MessageCircle,
  ArrowRight, Eye, Bell, LayoutGrid, List, Play, Pause, Moon, Quote
} from "lucide-react";
import { useUser } from "./UserContext/ThisUserContext";
import { useTranslation } from "./hooks/useTranslation";
import { getAllDJs, getAvailableDJs, getVerifiedDJs } from "./services/djService";

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

const BASE_API = "https://gigza-testing-11.onrender.com";
const FAVORITES_KEY = "gigza:favorites";
const PREVIEW_SECONDS = 30;
const MAX_COMPARE = 3;

// Genre keys — display via t("genreXxx")
const GENRES = [
  { key: "All", labelKey: "genreAll" },
  { key: "Electronic", labelKey: "genreElectronic" },
  { key: "Hip Hop", labelKey: "genreHipHop" },
  { key: "House", labelKey: "genreHouse" },
  { key: "Techno", labelKey: "genreTechno" },
  { key: "R&B", labelKey: "genreRnB" },
  { key: "Pop", labelKey: "genrePop" },
  { key: "Rock", labelKey: "genreRock" },
  { key: "Latin", labelKey: "genreLatin" },
  { key: "Jazz", labelKey: "genreJazz" },
];

const GENRE_STYLES = {
  Electronic: "from-cyan-500/40 to-blue-700/40",
  "Hip Hop": "from-amber-500/40 to-red-700/40",
  House: "from-fuchsia-500/40 to-purple-700/40",
  Techno: "from-zinc-500/40 to-slate-800/60",
  "R&B": "from-rose-500/40 to-pink-800/40",
  Pop: "from-pink-400/40 to-orange-500/40",
  Rock: "from-red-600/40 to-zinc-800/60",
  Latin: "from-yellow-500/40 to-orange-700/40",
  Jazz: "from-emerald-500/40 to-teal-800/40",
};

const BUDGETS = [
  { labelKey: "budgetUnder300", min: 0, max: 300 },
  { labelKey: "budget300To700", min: 300, max: 700 },
  { labelKey: "budget700Plus", min: 700, max: 1000 },
];

const HOW_IT_WORKS = [
  { titleKey: "howStep1Title", bodyKey: "howStep1Body" },
  { titleKey: "howStep2Title", bodyKey: "howStep2Body" },
  { titleKey: "howStep3Title", bodyKey: "howStep3Body" },
];

const safeNumber = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

const formatRating = (rating) => safeNumber(rating, 0).toFixed(1);
const byRatingDesc = (a, b) => safeNumber(b.rating, 0) - safeNumber(a.rating, 0);

const placeholder = (name, size = "400x300") =>
  `https://placehold.co/${size}/18181b/a1a1aa?text=${encodeURIComponent(name || "DJ")}`;

const makeImgFallback = (name, size) => (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = placeholder(name, size);
};

const bookPath = (dj, date) => `/book/${dj.id}${date ? `?date=${date}` : ""}`;

const isAvailableOn = (dj, date) => {
  if (!date) return true;
  if (Array.isArray(dj.booked_dates) && dj.booked_dates.includes(date)) return false;
  if (Array.isArray(dj.available_dates) && dj.available_dates.length > 0 && !dj.available_dates.includes(date)) {
    return false;
  }
  return true;
};

const formatDateLabel = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d) ? iso : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
};

const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const btnPrimary =
  "rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium " +
  "shadow-lg shadow-purple-900/30 hover:from-purple-500 hover:to-fuchsia-500 transition " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const btnGhost =
  "rounded-lg border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 hover:border-white/20 transition " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400";

const GLOBAL_CSS = `
.gz-eq{display:inline-flex;align-items:flex-end;gap:2px;height:14px}
.gz-eq i{display:block;width:3px;height:100%;background:currentColor;border-radius:2px;transform-origin:bottom;animation:gz-eq 900ms ease-in-out infinite}
.gz-eq i:nth-child(2){animation-delay:-300ms}
.gz-eq i:nth-child(3){animation-delay:-600ms}
.gz-eq i:nth-child(4){animation-delay:-150ms}
@keyframes gz-eq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
.gz-rise{animation:gz-rise 700ms cubic-bezier(.2,.7,.2,1) both}
@keyframes gz-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){
  .gz-eq i{animation:none;transform:scaleY(.6)}
  .gz-rise{animation:none}
}
`;

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                 */
/* ------------------------------------------------------------------ */

function Equalizer({ className = "" }) {
  return (
    <span className={`gz-eq ${className}`} aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}

function useModalBehavior(open, onClose) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);
}

function PlayButton({ dj, playingId, onToggle, className = "" }) {
  if (!dj.mix_url) return null;
  const playing = playingId === dj.id;
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(dj);
      }}
      aria-label={playing ? `Pause ${dj.name} preview` : `Play ${dj.name} preview`}
      aria-pressed={playing}
      className={`flex items-center justify-center gap-1.5 rounded-full bg-white text-black h-10 min-w-10 px-3 shadow-lg hover:bg-zinc-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${className}`}
    >
      {playing ? (
        <>
          <Equalizer className="text-fuchsia-600" />
          <Pause className="w-4 h-4 fill-black" />
        </>
      ) : (
        <Play className="w-4 h-4 fill-black ml-0.5" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Modals                                                              */
/* ------------------------------------------------------------------ */

function QuickViewModal({ dj, onClose, date }) {
  const { t } = useTranslation();
  useModalBehavior(!!dj, onClose);
  const onImgError = makeImgFallback(dj?.name, "800x400");
  if (!dj) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${dj.name || "DJ"} ${t("quickView")}`}
    >
      <div
        className="bg-zinc-900 max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 bg-zinc-800">
          <img src={dj.image || placeholder(dj.name, "800x400")} alt={dj.name} onError={onImgError} className="w-full h-full object-cover" />
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="absolute top-3 right-3 bg-black/60 backdrop-blur p-2 rounded-full hover:bg-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent p-5 pt-16">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-white truncate">{dj.name}</h2>
                <p className="text-zinc-300 text-sm truncate">{dj.tagline || t("professionalDJ")}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 bg-black/50 backdrop-blur rounded-full px-3 py-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-bold">{formatRating(dj.rating)}</span>
                <span className="text-zinc-400 text-sm">({safeNumber(dj.review_count, 0)})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              [t("price"), <>R{safeNumber(dj.price, 150)}<span className="text-sm text-zinc-500 font-normal"> {t("perHourShort")}</span></>],
              [t("genre"), dj.genre || t("genreElectronic")],
              [t("location"), dj.location?.split(",")[0] || t("worldwide")],
              [t("experience"), dj.years_experience || t("professional")],
            ].map(([label, value], i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                <p className="text-zinc-500 text-xs">{label}</p>
                <p className="text-white font-semibold truncate">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link to={`/dj/${dj.id}`} className={`${btnPrimary} flex-1 px-5 py-2.5 text-center`}>
              {t("viewFullProfile")}
            </Link>
            <Link to={bookPath(dj, date)} className={`${btnGhost} px-5 py-2.5`}>
              {t("bookNow")}
            </Link>
            <button className={`${btnGhost} px-5 py-2.5 flex items-center gap-2`}>
              <MessageCircle className="w-4 h-4" />
              {t("message")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareModal({ items, onClose, onRemove, date }) {
  const { t } = useTranslation();
  useModalBehavior(true, onClose);

  const prices = items.map((d) => safeNumber(d.price, 150));
  const ratings = items.map((d) => safeNumber(d.rating, 0));
  const bestPrice = Math.min(...prices);
  const bestRating = Math.max(...ratings);

  const rows = [
    { labelKey: "pricePerHour", value: (d) => `R${safeNumber(d.price, 150)}`, best: (d) => safeNumber(d.price, 150) === bestPrice },
    { labelKey: "rating", value: (d) => `${formatRating(d.rating)} (${safeNumber(d.review_count, 0)} ${t("reviewsLower")})`, best: (d) => safeNumber(d.rating, 0) === bestRating },
    { labelKey: "genre", value: (d) => d.genre || t("genreElectronic") },
    { labelKey: "location", value: (d) => d.location?.split(",")[0] || t("worldwide") },
    { labelKey: "experience", value: (d) => d.years_experience || t("professional") },
    { labelKey: "verified", value: (d) => (d.verified ? t("yes") : t("no")) },
  ];

  const cols = { gridTemplateColumns: `minmax(6rem, 0.8fr) repeat(${items.length}, minmax(0, 1fr))` };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("compareDJs")}
    >
      <div
        className="bg-zinc-900 max-w-4xl w-full max-h-[90vh] overflow-auto rounded-2xl border border-white/10 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold">{t("compareDJs")}</h2>
          <button onClick={onClose} aria-label={t("close")} className="p-2 rounded-full hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 min-w-[34rem]">
          <div className="grid gap-4 items-end pb-4" style={cols}>
            <div />
            {items.map((dj) => (
              <div key={dj.id} className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden bg-zinc-800">
                  <img
                    src={dj.image || placeholder(dj.name, "160x160")}
                    alt={dj.name}
                    onError={makeImgFallback(dj.name, "160x160")}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2 font-medium truncate">{dj.name}</p>
                <button onClick={() => onRemove(dj)} className="text-xs text-zinc-500 hover:text-white transition">
                  {t("remove")}
                </button>
              </div>
            ))}
          </div>

          {rows.map((row) => (
            <div key={row.labelKey} className="grid gap-4 py-3 border-t border-white/10 text-sm" style={cols}>
              <div className="text-zinc-500">{t(row.labelKey)}</div>
              {items.map((dj) => (
                <div
                  key={dj.id}
                  className={`text-center ${row.best && items.length > 1 && row.best(dj) ? "text-green-400 font-semibold" : "text-white"}`}
                >
                  {row.value(dj)}
                </div>
              ))}
            </div>
          ))}

          <div className="grid gap-4 pt-4 border-t border-white/10" style={cols}>
            <div />
            {items.map((dj) => (
              <Link key={dj.id} to={bookPath(dj, date)} className={`${btnPrimary} py-2 text-sm text-center`}>
                {t("bookNow")}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Home page sections                                                  */
/* ------------------------------------------------------------------ */

function TonightStrip({ djs, date, playingId, onToggle, navigate }) {
  const { t } = useTranslation();
  if (!djs.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-5 pt-8" aria-labelledby="tonight-heading">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-green-500/10">
          <Moon className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h2 id="tonight-heading" className="font-semibold">{t("needDJTonight")}</h2>
          <p className="text-zinc-400 text-sm">{t("needDJTonightSub")}</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {djs.map((dj) => {
          const playing = playingId === dj.id;
          return (
            <div
              key={dj.id}
              className="shrink-0 w-72 flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-zinc-900 hover:border-white/25 transition"
            >
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800">
                  <img
                    src={dj.image || placeholder(dj.name, "100x100")}
                    alt={dj.name}
                    onError={makeImgFallback(dj.name, "100x100")}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5" title={t("availableNow")}>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping motion-reduce:animate-none" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-zinc-900" />
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate flex items-center gap-2">
                  {dj.name}
                  {playing && <Equalizer className="text-fuchsia-400" />}
                </p>
                <p className="text-zinc-400 text-sm truncate">
                  {dj.genre || t("genreElectronic")} · R{safeNumber(dj.price, 150)}{t("perHourShort")}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {dj.mix_url && (
                  <button
                    onClick={() => onToggle(dj)}
                    aria-label={playing ? `Pause ${dj.name} preview` : `Play ${dj.name} preview`}
                    className={`${btnGhost} p-2 rounded-full`}
                  >
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
                <button onClick={() => navigate(bookPath(dj, date))} className={`${btnPrimary} px-3.5 py-1.5 text-sm`}>
                  {t("book")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GenreTiles({ djs, activeGenre, onSelect }) {
  const { t } = useTranslation();
  const counts = useMemo(() => {
    const map = {};
    djs.forEach((d) => {
      if (d.genre) map[d.genre] = (map[d.genre] || 0) + 1;
    });
    return map;
  }, [djs]);

  return (
    <section className="max-w-7xl mx-auto px-5 pt-8" aria-labelledby="genres-heading">
      <h2 id="genres-heading" className="font-semibold mb-4">{t("browseByGenre")}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GENRES.filter((g) => g.key !== "All").map(({ key: genre, labelKey }) => {
          const active = activeGenre === genre;
          return (
            <button
              key={genre}
              onClick={() => onSelect(active ? "All" : genre)}
              aria-pressed={active}
              className={`shrink-0 w-40 h-24 rounded-2xl p-4 text-left bg-gradient-to-br ${GENRE_STYLES[genre]} border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${
                active ? "border-fuchsia-400 ring-2 ring-fuchsia-500/40" : "border-white/10 hover:border-white/30"
              }`}
            >
              <span className="block font-semibold text-white">{t(labelKey)}</span>
              <span className="block text-sm text-zinc-200/80 mt-1">
                {counts[genre] || 0} {counts[genre] === 1 ? t("dj") : t("djs")}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SpotlightCard({ dj, date, playingId, onToggle, navigate }) {
  const { t } = useTranslation();
  if (!dj) return null;
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 min-h-[22rem] group">
      <img
        src={dj.image || placeholder(dj.name, "900x600")}
        alt={dj.name}
        onError={makeImgFallback(dj.name, "900x600")}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />

      <div className="relative h-full min-h-[22rem] flex flex-col justify-between p-6">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium">{t("djOfTheWeek")}</span>
          {dj.verified && (
            <span className="rounded-full bg-blue-600/90 px-2.5 py-1 text-xs font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {t("verified")}
            </span>
          )}
        </div>

        <div>
          <h2 className="text-3xl font-bold tracking-tight">{dj.name}</h2>
          <p className="text-zinc-300 mt-1 line-clamp-2 max-w-lg">{dj.tagline || t("professionalDJ")}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-zinc-300">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {formatRating(dj.rating)} ({safeNumber(dj.review_count, 0)})
            </span>
            <span className="flex items-center gap-1"><Music className="w-4 h-4" />{dj.genre || t("genreElectronic")}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{dj.location?.split(",")[0] || t("worldwide")}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button onClick={() => navigate(bookPath(dj, date))} className={`${btnPrimary} px-6 py-2.5`}>
              {t("bookFrom")} R{safeNumber(dj.price, 150)}{t("perHourShort")}
            </button>
            <Link to={`/dj/${dj.id}`} className="rounded-lg border border-white/30 text-white px-5 py-2.5 hover:bg-white/10 transition">
              {t("viewProfile")}
            </Link>
            <PlayButton dj={dj} playingId={playingId} onToggle={onToggle} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsStrip({ reviews }) {
  const { t } = useTranslation();
  if (!reviews.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-5 pb-10" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="font-semibold mb-4">{t("whatClientsSaying")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map((r, i) => (
          <figure key={`${r.djId}-${i}`} className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex flex-col">
            <Quote className="w-5 h-5 text-purple-400 mb-3" />
            <blockquote className="text-zinc-200 text-sm leading-relaxed line-clamp-5 flex-1">{r.comment}</blockquote>
            <figcaption className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
              <span className="text-zinc-400 truncate">
                {r.author} <Link to={`/dj/${r.djId}`} className="text-white hover:text-purple-300 transition">{r.djName}</Link>
              </span>
              {r.rating != null && (
                <span className="flex items-center gap-1 shrink-0 ml-3">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  {formatRating(r.rating)}
                </span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useTranslation();
  return (
    <section className="border-t border-white/10 bg-zinc-900/30" aria-labelledby="how-heading">
      <div className="max-w-7xl mx-auto px-5 py-12">
        <h2 id="how-heading" className="text-2xl font-bold tracking-tight mb-8">{t("howBookingWorks")}</h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.titleKey} className="flex gap-4">
              <span className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center font-semibold">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{t(step.titleKey)}</h3>
                <p className="text-zinc-400 text-sm mt-1 max-w-xs">{t(step.bodyKey)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Main screen                                                         */
/* ------------------------------------------------------------------ */

export function HomeScreen() {
  const navigate = useNavigate();
  const { user, logout, getToken } = useUser();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [eventDate, setEventDate] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState("rating");
  const [djs, setDjs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [trendingDJs, setTrendingDJs] = useState([]);
  const [tonightDJs, setTonightDJs] = useState([]);

  const [selectedDJ, setSelectedDJ] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);
  const audioRef = useRef(null);

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform || "");

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const fetchDJs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data;

      if (showOnlyAvailable && showOnlyVerified) {
        data = await getAllDJs({ verified_only: true, available_only: true });
        setDjs(data.djs || []);
      } else if (showOnlyAvailable) {
        data = await getAvailableDJs();
        setDjs(data.available_djs || []);
      } else if (showOnlyVerified) {
        data = await getVerifiedDJs();
        setDjs(data.verified_djs || []);
      } else {
        data = await getAllDJs();
        setDjs(data.djs || []);
      }

      if (data.djs) {
        setTrendingDJs([...data.djs].sort(byRatingDesc).slice(0, 3));
      }
    } catch (err) {
      console.error("Error fetching DJs:", err);
      setError(err.message || t("failedToLoadDJs"));
      setDjs([]);
    } finally {
      setLoading(false);
    }
  }, [showOnlyAvailable, showOnlyVerified, t]);

  useEffect(() => {
    fetchDJs();
  }, [fetchDJs]);

  useEffect(() => {
    let cancelled = false;
    getAvailableDJs()
      .then((data) => {
        if (!cancelled) setTonightDJs((data?.available_djs || []).slice(0, 8));
      })
      .catch((err) => console.warn("Tonight strip unavailable:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePlay = useCallback(
    (dj) => {
      if (!dj?.mix_url) return;

      if (!audioRef.current) audioRef.current = new Audio();
      const audio = audioRef.current;

      if (playingId === dj.id) {
        audio.pause();
        setPlayingId(null);
        return;
      }

      audio.pause();
      audio.src = dj.mix_url;
      audio.currentTime = 0;
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
      audio.ontimeupdate = () => {
        if (audio.currentTime >= PREVIEW_SECONDS) {
          audio.pause();
          setPlayingId(null);
        }
      };

      audio
        .play()
        .then(() => setPlayingId(dj.id))
        .catch(() => setPlayingId(null));
    },
    [playingId]
  );

  const q = searchQuery.toLowerCase();

  const filteredDJs = useMemo(() => {
    return djs
      .filter((dj) => {
        const matchesSearch =
          (dj.name || "").toLowerCase().includes(q) ||
          (dj.genre || "").toLowerCase().includes(q) ||
          (dj.tagline || "").toLowerCase().includes(q);
        const matchesGenre = activeGenre === "All" || (dj.genre || "") === activeGenre;
        const price = safeNumber(dj.price, 0);
        const matchesPrice = price >= priceRange.min && price <= priceRange.max;
        return matchesSearch && matchesGenre && matchesPrice && isAvailableOn(dj, eventDate);
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price_low":
            return safeNumber(a.price, 0) - safeNumber(b.price, 0);
          case "price_high":
            return safeNumber(b.price, 0) - safeNumber(a.price, 0);
          case "name":
            return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
          case "rating":
          default:
            return byRatingDesc(a, b);
        }
      });
  }, [djs, q, activeGenre, priceRange, sortBy, eventDate]);

  const spotlightDJ = useMemo(() => {
    const verified = djs.filter((d) => d.verified).sort(byRatingDesc).slice(0, 5);
    const pool = verified.length ? verified : [...djs].sort(byRatingDesc).slice(0, 5);
    if (!pool.length) return null;
    const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    return pool[week % pool.length];
  }, [djs]);

  const favoriteDJs = useMemo(() => djs.filter((d) => favorites.includes(d.id)), [djs, favorites]);

  const reviews = useMemo(() => {
    return djs
      .flatMap((dj) =>
        (Array.isArray(dj.reviews) ? dj.reviews : [])
          .filter((r) => r && r.comment)
          .map((r) => ({
            comment: r.comment,
            rating: r.rating,
            author: r.author || r.client_name || r.reviewer || t("aClient"),
            djName: dj.name,
            djId: dj.id,
          }))
      )
      .sort((a, b) => safeNumber(b.rating, 0) - safeNumber(a.rating, 0))
      .slice(0, 3);
  }, [djs, t]);

  const stats = useMemo(() => {
    const rated = djs.filter((d) => safeNumber(d.rating, 0) > 0);
    const avg = rated.length ? rated.reduce((s, d) => s + safeNumber(d.rating, 0), 0) / rated.length : 0;
    return {
      total: djs.length,
      verified: djs.filter((d) => d.verified).length,
      avg,
    };
  }, [djs]);

  const toggleFavorite = (djId) => {
    setFavorites((prev) => (prev.includes(djId) ? prev.filter((id) => id !== djId) : [...prev, djId]));
  };

  const toggleCompare = (dj) => {
    setCompareList((prev) => {
      if (prev.some((d) => d.id === dj.id)) return prev.filter((d) => d.id !== dj.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, dj];
    });
  };

  const removeFromCompare = (dj) => {
    setCompareList((prev) => {
      const next = prev.filter((d) => d.id !== dj.id);
      if (next.length < 2) setShowCompare(false);
      return next;
    });
  };

  const closeQuickView = useCallback(() => setSelectedDJ(null), []);
  const closeCompare = useCallback(() => setShowCompare(false), []);

  const selectGenre = (genre) => {
    setActiveGenre(genre);
    if (genre !== "All") scrollToResults();
  };

  const applyBudget = (budget) => {
    const active = priceRange.min === budget.min && priceRange.max === budget.max;
    setPriceRange(active ? { min: 0, max: 1000 } : { min: budget.min, max: budget.max });
  };

  const handleLogout = async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${BASE_API}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch((err) => console.warn("Logout API error:", err));
      }
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setActiveGenre("All");
    setEventDate("");
    setPriceRange({ min: 0, max: 1000 });
    setShowOnlyAvailable(false);
    setShowOnlyVerified(false);
  };

  const renderCompareToggle = (dj) => {
    const checked = compareList.some((d) => d.id === dj.id);
    const disabled = !checked && compareList.length >= MAX_COMPARE;
    return (
      <label
        className={`flex items-center gap-1.5 text-xs select-none ${
          disabled ? "text-zinc-600 cursor-not-allowed" : "text-zinc-400 hover:text-white cursor-pointer"
        }`}
        title={disabled ? `${t("compareUpTo")} ${MAX_COMPARE} ${t("djs")}` : t("addToCompare")}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={() => toggleCompare(dj)}
          className="accent-fuchsia-500"
        />
        {t("compare")}
      </label>
    );
  };

  const renderDJCard = (dj) => {
    const rating = safeNumber(dj.rating, 0);
    const price = safeNumber(dj.price, 150);
    const reviewCount = safeNumber(dj.review_count, 0);
    const isFavorite = favorites.includes(dj.id);

    return (
      <article
        key={dj.id}
        className="group flex flex-col bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden hover:border-white/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-950/30 transition duration-300"
      >
        <div className="relative h-52 overflow-hidden bg-zinc-800">
          <img
            src={dj.image || placeholder(dj.name)}
            alt={dj.name}
            loading="lazy"
            onError={makeImgFallback(dj.name)}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-14 pr-16">
            <h3 className="text-white font-semibold text-lg leading-tight truncate">{dj.name || t("professionalDJ")}</h3>
            <p className="flex items-center gap-1.5 text-zinc-300 text-sm mt-0.5">
              <Music className="w-3.5 h-3.5" />
              {dj.genre || t("genreElectronic")}
            </p>
          </div>

          <div className="hidden md:flex absolute inset-0 bg-black/55 backdrop-blur-[2px] items-center justify-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300">
            <button
              onClick={() => setSelectedDJ(dj)}
              className="rounded-lg bg-white text-black px-4 py-1.5 text-sm font-medium hover:bg-zinc-200 transition flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
              <Eye className="w-4 h-4" />
              {t("quickView")}
            </button>
            <Link
              to={`/dj/${dj.id}`}
              className="rounded-lg border border-white/40 text-white px-4 py-1.5 text-sm font-medium hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
              {t("viewProfile")}
            </Link>
          </div>

          {dj.verified && (
            <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur rounded-full px-2.5 py-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-medium">{t("verified")}</span>
            </div>
          )}

          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            <button
              onClick={() => toggleFavorite(dj.id)}
              aria-label={isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
              aria-pressed={isFavorite}
              className="bg-black/60 backdrop-blur p-2 rounded-full hover:bg-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-white"}`} />
            </button>
            <div className="bg-black/60 backdrop-blur rounded-full px-2.5 py-1 flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-xs font-medium">{rating.toFixed(1)}</span>
              <span className="text-zinc-400 text-xs">({reviewCount})</span>
            </div>
          </div>

          <PlayButton dj={dj} playingId={playingId} onToggle={togglePlay} className="absolute bottom-3 right-3 z-10" />
        </div>

        <div className="flex flex-col flex-1 p-4">
          <p className="text-zinc-400 text-sm line-clamp-1">{dj.tagline || t("professionalDJ")}</p>
          <div className="flex items-center justify-between mt-1.5">
            <p className="flex items-center gap-1 text-xs text-zinc-500">
              <MapPin className="w-3 h-3" />
              {dj.location?.split(",")[0] || t("worldwide")}
            </p>
            {renderCompareToggle(dj)}
          </div>

          <div className="md:hidden flex gap-2 mt-3">
            <button onClick={() => setSelectedDJ(dj)} className={`${btnGhost} flex-1 py-1.5 text-sm`}>
              {t("quickView")}
            </button>
            <Link to={`/dj/${dj.id}`} className={`${btnGhost} flex-1 py-1.5 text-sm text-center`}>
              {t("profileShort")}
            </Link>
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between">
            <div>
              <span className="text-white font-bold text-xl">R{price}</span>
              <span className="text-zinc-500 text-xs"> {t("perHour")}</span>
            </div>
            <button onClick={() => navigate(bookPath(dj, eventDate))} className={`${btnPrimary} px-5 py-2 text-sm`}>
              {t("bookNow")}
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderDJListItem = (dj) => {
    const rating = safeNumber(dj.rating, 0);
    const price = safeNumber(dj.price, 150);
    const reviewCount = safeNumber(dj.review_count, 0);
    const isFavorite = favorites.includes(dj.id);

    return (
      <article
        key={dj.id}
        className="group bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden hover:border-white/25 transition"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative sm:w-48 h-44 sm:h-auto flex-shrink-0 overflow-hidden bg-zinc-800">
            <img
              src={dj.image || placeholder(dj.name)}
              alt={dj.name}
              loading="lazy"
              onError={makeImgFallback(dj.name)}
              className="w-full h-full object-cover"
            />
            {dj.verified && (
              <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur rounded-full px-2.5 py-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-medium">{t("verified")}</span>
              </div>
            )}
            <PlayButton dj={dj} playingId={playingId} onToggle={togglePlay} className="absolute bottom-3 right-3 z-10" />
          </div>

          <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-lg truncate">{dj.name}</h3>
                  <p className="text-zinc-400 text-sm truncate">{dj.tagline || t("professionalDJ")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 bg-white/5 rounded-full px-2.5 py-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-sm font-medium">{rating.toFixed(1)}</span>
                    <span className="text-zinc-500 text-xs">({reviewCount})</span>
                  </div>
                  <button
                    onClick={() => toggleFavorite(dj.id)}
                    aria-label={isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
                    aria-pressed={isFavorite}
                    className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-white/5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-zinc-400">
                <span className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {dj.location?.split(",")[0] || t("worldwide")}
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1">
                  <Music className="w-3.5 h-3.5" />
                  {dj.genre || t("genreElectronic")}
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {dj.years_experience || t("professional")}
                </span>
                <span className="ml-auto">{renderCompareToggle(dj)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-white/10">
              <div>
                <span className="text-white font-bold text-xl">R{price}</span>
                <span className="text-zinc-500 text-sm"> {t("perHour")}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedDJ(dj)} className={`${btnGhost} px-3.5 py-1.5 text-sm`}>
                  {t("quickView")}
                </button>
                <Link to={`/dj/${dj.id}`} className={`${btnGhost} px-3.5 py-1.5 text-sm`}>
                  {t("profileShort")}
                </Link>
                <button onClick={() => navigate(bookPath(dj, eventDate))} className={`${btnPrimary} px-5 py-1.5 text-sm`}>
                  {t("bookNow")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
          <div className="h-52 bg-zinc-800" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-zinc-800 rounded-full w-3/4" />
            <div className="h-3 bg-zinc-800 rounded-full w-1/2" />
            <div className="h-9 bg-zinc-800 rounded-lg mt-4" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <div className="text-center py-16">
      <div className="inline-flex p-4 bg-red-500/10 rounded-2xl mb-4">
        <X className="w-10 h-10 text-red-400" />
      </div>
      <p className="text-red-400 mb-4">{error}</p>
      <button onClick={fetchDJs} className={`${btnGhost} px-5 py-2 text-sm`}>
        {t("tryAgain")}
      </button>
    </div>
  );

  const renderEmpty = () => (
    <div className="text-center py-16">
      <div className="inline-flex p-4 bg-white/5 rounded-2xl mb-4">
        <Headphones className="w-10 h-10 text-zinc-500" />
      </div>
      <h3 className="text-white text-xl font-bold mb-2">{t("noDJsFound")}</h3>
      <p className="text-zinc-400 mb-5">
        {eventDate
          ? `${t("noDJsOnDate")} ${formatDateLabel(eventDate)}. ${t("tryAnotherDate")}`
          : t("tryDifferentSearch")}
      </p>
      <button onClick={resetAllFilters} className={`${btnGhost} px-5 py-2 text-sm`}>
        {t("clearAllFilters")}
      </button>
    </div>
  );

  const showFeatured = !loading && !error && (spotlightDJ || trendingDJs.length > 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 py-3">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 rounded-lg">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
                <Headphones className="w-5 h-5 text-white" />
              </span>
              <span className="text-xl font-bold tracking-tight">Gigza</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                aria-label={t("notifications")}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              >
                <Bell className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                  className="flex items-center gap-2 border border-white/10 rounded-full pl-1.5 pr-3 py-1 hover:border-white/25 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm hidden sm:inline">{user?.username || t("user")}</span>
                  <ChevronDown className={`w-3 h-3 text-zinc-400 transition ${showUserMenu ? "rotate-180" : ""}`} />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-60 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="font-medium truncate">{user?.username || t("user")}</p>
                        <p className="text-zinc-400 text-sm truncate">{user?.email || "user@example.com"}</p>
                      </div>
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition" onClick={() => setShowUserMenu(false)}>
                        <User className="w-4 h-4" /> {t("myProfile")}
                      </Link>
                      <Link to="/bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition" onClick={() => setShowUserMenu(false)}>
                        <Calendar className="w-4 h-4" /> {t("myBookings")}
                        <span className="ml-auto text-xs bg-purple-600 text-white rounded-full px-2 py-0.5">3</span>
                      </Link>
                      <Link to="/emergency" className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition" onClick={() => setShowUserMenu(false)}>
                        <Zap className="w-4 h-4" /> {t("emergencySOS")}
                      </Link>
                      <hr className="border-white/10" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition">
                        <LogOut className="w-4 h-4" /> {t("logOut")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[46rem] max-w-full h-[26rem] rounded-full bg-purple-600/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 translate-x-1/4 w-80 h-64 rounded-full bg-fuchsia-600/15 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-5 py-16 md:py-20">
          <div className="gz-rise text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">{t("heroTitle")}</h1>

            <p className="text-zinc-400 max-w-2xl mx-auto mb-9 text-lg">
              {t("heroSubtitle")}
            </p>

            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center bg-zinc-900/80 backdrop-blur border border-white/15 rounded-3xl md:rounded-full pl-5 pr-2 py-2 shadow-xl shadow-black/40 focus-within:border-fuchsia-500/60 focus-within:ring-4 focus-within:ring-fuchsia-500/15 transition">
                <div className="flex items-center flex-1 min-w-0">
                  <Search className="h-5 w-5 text-zinc-500 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    aria-label={t("searchDJs")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-white placeholder-zinc-500 py-2.5 px-3 focus:outline-none"
                  />
                  <kbd className="hidden lg:inline-flex items-center gap-1 mr-2 text-xs text-zinc-500 border border-white/10 rounded-md px-1.5 py-0.5">
                    {isMac ? "⌘" : "Ctrl"} K
                  </kbd>
                </div>

                <div className="hidden md:block w-px h-7 bg-white/10 mx-2" />
                <div className="md:hidden h-px bg-white/10 my-1" />

                <label className="flex items-center gap-2 py-1.5 md:px-2 text-left">
                  <Calendar className="h-5 w-5 text-zinc-500 shrink-0" />
                  <span className="sr-only">{t("eventDate")}</span>
                  <input
                    type="date"
                    min={todayISO()}
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    aria-label={t("eventDate")}
                    className="bg-transparent text-white py-1 focus:outline-none [color-scheme:dark] w-full md:w-auto"
                  />
                </label>

                <button onClick={scrollToResults} className={`${btnPrimary} rounded-full px-6 py-2.5 mt-2 md:mt-0 md:ml-2`}>
                  {t("search")}
                </button>
              </div>

              {eventDate && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-zinc-300">
                  <span>{t("showingDJsFreeOn")} {formatDateLabel(eventDate)}</span>
                  <button onClick={() => setEventDate("")} className="text-zinc-500 hover:text-white transition flex items-center gap-1">
                    <X className="w-3 h-3" /> {t("clearDate")}
                  </button>
                </div>
              )}
            </div>

            {!loading && !error && stats.total > 0 && (
              <dl className="mt-8 flex items-center justify-center gap-6 md:gap-10 text-sm">
                <div>
                  <dt className="text-zinc-500">{t("djsListed")}</dt>
                  <dd className="text-white font-semibold text-lg">{stats.total}</dd>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <dt className="text-zinc-500">{t("verified")}</dt>
                  <dd className="text-white font-semibold text-lg">{stats.verified}</dd>
                </div>
                {stats.avg > 0 && (
                  <>
                    <div className="w-px h-8 bg-white/10" />
                    <div>
                      <dt className="text-zinc-500">{t("averageRating")}</dt>
                      <dd className="text-white font-semibold text-lg">{stats.avg.toFixed(1)}</dd>
                    </div>
                  </>
                )}
              </dl>
            )}
          </div>
        </div>
      </section>

      <TonightStrip djs={tonightDJs} date={eventDate} playingId={playingId} onToggle={togglePlay} navigate={navigate} />

      {!loading && !error && djs.length > 0 && <GenreTiles djs={djs} activeGenre={activeGenre} onSelect={selectGenre} />}

      {showFeatured && (
        <section className="max-w-7xl mx-auto px-5 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {spotlightDJ && (
              <div className="lg:col-span-3">
                <SpotlightCard dj={spotlightDJ} date={eventDate} playingId={playingId} onToggle={togglePlay} navigate={navigate} />
              </div>
            )}

            {trendingDJs.length > 0 && (
              <div className={`${spotlightDJ ? "lg:col-span-2" : "lg:col-span-5"} border border-white/10 bg-zinc-900/60 rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-yellow-500/10">
                      <TrendingUp className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold">{t("trendingDJs")}</h2>
                      <p className="text-zinc-400 text-sm">{t("trendingDJsSub")}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSortBy("rating");
                      setActiveGenre("All");
                      scrollToResults();
                    }}
                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 transition"
                  >
                    {t("viewAll")} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {trendingDJs.map((dj, index) => (
                    <Link
                      key={dj.id}
                      to={`/dj/${dj.id}`}
                      className="group flex items-center gap-4 p-3 rounded-xl border border-white/10 hover:border-white/25 hover:bg-white/5 transition"
                    >
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800">
                          <img
                            src={dj.image || placeholder(dj.name, "100x100")}
                            alt={dj.name}
                            onError={makeImgFallback(dj.name, "100x100")}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-[10px] font-bold text-white">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate group-hover:text-purple-300 transition">{dj.name}</h3>
                        <p className="text-zinc-400 text-sm truncate">{dj.genre || t("genreElectronic")}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-white text-sm">{formatRating(dj.rating)}</span>
                        </div>
                        <p className="text-zinc-500 text-xs">{safeNumber(dj.review_count, 0)} {t("reviewsLower")}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {!loading && favoriteDJs.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 pt-8" aria-labelledby="favorites-heading">
          <h2 id="favorites-heading" className="font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 fill-red-500 text-red-500" /> {t("yourFavorites")}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {favoriteDJs.map((dj) => (
              <Link
                key={dj.id}
                to={`/dj/${dj.id}`}
                className="shrink-0 w-64 flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-zinc-900 hover:border-white/25 transition"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                  <img
                    src={dj.image || placeholder(dj.name, "100x100")}
                    alt={dj.name}
                    onError={makeImgFallback(dj.name, "100x100")}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{dj.name}</p>
                  <p className="text-zinc-400 text-sm truncate">
                    {dj.genre || t("genreElectronic")} · R{safeNumber(dj.price, 150)}{t("perHourShort")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section ref={resultsRef} className="max-w-7xl mx-auto px-5 py-8 scroll-mt-20">
        <h2 className="text-2xl font-bold tracking-tight mb-5">{t("allDJs")}</h2>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="relative min-w-0 md:flex-1">
            <div className="flex gap-2 overflow-x-auto pb-1 pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {GENRES.map(({ key, labelKey }) => (
                <button
                  key={key}
                  onClick={() => setActiveGenre(key)}
                  aria-pressed={activeGenre === key}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${
                    activeGenre === key
                      ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium"
                      : "border border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-zinc-950 to-transparent" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              aria-label={viewMode === "grid" ? t("switchToList") : t("switchToGrid")}
              className={`${btnGhost} p-2`}
            >
              {viewMode === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label={t("sortDJs")}
              className="bg-zinc-900 border border-white/10 rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:border-fuchsia-500/60"
            >
              <option value="rating">{t("sortTopRated")}</option>
              <option value="price_low">{t("sortPriceLow")}</option>
              <option value="price_high">{t("sortPriceHigh")}</option>
              <option value="name">{t("sortName")}</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              className={`${btnGhost} flex items-center gap-2 px-3 py-2 text-sm ${showFilters ? "bg-white/10 text-white" : ""}`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">{t("filters")}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center mb-5">
          <button
            onClick={() => {
              setShowOnlyAvailable(!showOnlyAvailable);
              setShowOnlyVerified(false);
            }}
            aria-pressed={showOnlyAvailable}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${
              showOnlyAvailable ? "bg-green-600 text-white" : "border border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            {t("availableNowFilter")}
          </button>
          <button
            onClick={() => {
              setShowOnlyVerified(!showOnlyVerified);
              setShowOnlyAvailable(false);
            }}
            aria-pressed={showOnlyVerified}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${
              showOnlyVerified ? "bg-blue-600 text-white" : "border border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {t("verifiedOnly")}
          </button>

          <span className="hidden sm:block w-px h-5 bg-white/10 mx-1" />

          {BUDGETS.map((budget) => {
            const active = priceRange.min === budget.min && priceRange.max === budget.max;
            return (
              <button
                key={budget.labelKey}
                onClick={() => applyBudget(budget)}
                aria-pressed={active}
                className={`rounded-full px-3.5 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${
                  active ? "bg-purple-600 text-white" : "border border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
                }`}
              >
                {t(budget.labelKey)}
              </button>
            );
          })}

          {(showOnlyAvailable || showOnlyVerified) && (
            <button
              onClick={() => {
                setShowOnlyAvailable(false);
                setShowOnlyVerified(false);
              }}
              className="text-zinc-500 text-sm hover:text-white transition flex items-center gap-1"
            >
              <X className="w-3 h-3" /> {t("clear")}
            </button>
          )}
          <div className="flex-1" />
          <span className="text-zinc-500 text-sm" aria-live="polite">{filteredDJs.length} {t("djsFound")}</span>
        </div>

        {showFilters && (
          <div className="border border-white/10 bg-zinc-900/60 rounded-2xl p-5 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm text-zinc-400 block mb-3">{t("priceRange")}</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm w-20 text-zinc-300">{t("min")} R{priceRange.min}</span>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange((p) => ({ ...p, min: Math.min(parseInt(e.target.value), p.max) }))}
                      className="flex-1 accent-fuchsia-500"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm w-20 text-zinc-300">{t("max")} R{priceRange.max}</span>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange((p) => ({ ...p, max: Math.max(parseInt(e.target.value), p.min) }))}
                      className="flex-1 accent-fuchsia-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setPriceRange({ min: 0, max: 1000 });
                    setShowFilters(false);
                  }}
                  className="text-zinc-400 hover:text-white text-sm transition"
                >
                  {t("resetFilters")}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          renderSkeletons()
        ) : error ? (
          renderError()
        ) : filteredDJs.length === 0 ? (
          renderEmpty()
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" : "space-y-4"}>
            {filteredDJs.map((dj) => (viewMode === "grid" ? renderDJCard(dj) : renderDJListItem(dj)))}
          </div>
        )}
      </section>

      {!loading && !error && <ReviewsStrip reviews={reviews} />}
      <HowItWorks />

      {compareList.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-zinc-900/95 backdrop-blur border border-white/15 rounded-full pl-3 pr-2 py-2 shadow-2xl shadow-black/60">
            <div className="flex -space-x-2">
              {compareList.map((dj) => (
                <img
                  key={dj.id}
                  src={dj.image || placeholder(dj.name, "60x60")}
                  alt={dj.name}
                  onError={makeImgFallback(dj.name, "60x60")}
                  className="w-8 h-8 rounded-full object-cover border-2 border-zinc-900"
                />
              ))}
            </div>
            <span className="text-sm text-zinc-300">
              {compareList.length} {t("selected")}
              {compareList.length < 2 && <span className="text-zinc-500"> {t("pickAtLeastTwo")}</span>}
            </span>
            <button
              onClick={() => setShowCompare(true)}
              disabled={compareList.length < 2}
              className={`${btnPrimary} px-4 py-1.5 text-sm rounded-full disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {t("compare")}
            </button>
            <button
              onClick={() => setCompareList([])}
              aria-label={t("clearComparison")}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {selectedDJ && <QuickViewModal dj={selectedDJ} date={eventDate} onClose={closeQuickView} />}
      {showCompare && compareList.length >= 2 && (
        <CompareModal items={compareList} date={eventDate} onClose={closeCompare} onRemove={removeFromCompare} />
      )}
    </div>
  );
}