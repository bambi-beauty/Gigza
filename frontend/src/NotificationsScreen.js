// screens/NotificationsScreen.jsx

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Award,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  CreditCard,
  DollarSign,
  Flame,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
  X,
  AlertCircle,
} from "lucide-react";
import { useUser } from "../../frontend/src/UserContext/ThisUserContext.js";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../src/hooks/useTranslation.js";

// ============================================
// CONFIG
// ============================================

const BASE_API = "https://gigza-testing-11.onrender.com";
const LIMIT = 20;
const POLL_MS = 30000;
const UNDO_MS = 5000;
const STREAK_KEY = "gigza_inbox_streak";

// ============================================
// NOTIFICATION TYPE METADATA
// Labels/CTAs are translation KEYS now — the
// component resolves them with t() at render time.
// ============================================

const TYPE_META = {
  booking_created:        { icon: Calendar,      tone: "bg-purple-500/20 text-purple-300", labelKey: "notifTypeBookingCreated",    ctaKey: "notifCtaReviewBooking", category: "bookings", actionable: true },
  booking_confirmed:      { icon: Calendar,      tone: "bg-emerald-500/20 text-emerald-300", labelKey: "notifTypeBookingConfirmed", ctaKey: "notifCtaViewBooking",   category: "bookings" },
  booking_cancelled:      { icon: Calendar,      tone: "bg-red-500/20 text-red-300",     labelKey: "notifTypeBookingCancelled", ctaKey: "notifCtaSeeDetails",    category: "bookings" },
  booking_rescheduled:    { icon: Calendar,      tone: "bg-orange-500/20 text-orange-300", labelKey: "notifTypeBookingRescheduled", ctaKey: "notifCtaCheckTime", category: "bookings", actionable: true },
  booking_status_updated: { icon: Calendar,      tone: "bg-blue-500/20 text-blue-300",   labelKey: "notifTypeBookingUpdated",   ctaKey: "notifCtaViewBooking",   category: "bookings" },
  booking_completed:      { icon: Calendar,      tone: "bg-emerald-500/20 text-emerald-300", labelKey: "notifTypeBookingCompleted", ctaKey: "notifCtaViewBooking", category: "bookings" },
  payment_received:       { icon: DollarSign,    tone: "bg-green-500/20 text-green-300",  labelKey: "notifTypePaymentReceived",  ctaKey: "notifCtaViewPayment",   category: "payments" },
  payment_failed:         { icon: CreditCard,    tone: "bg-red-500/20 text-red-300",     labelKey: "notifTypePaymentFailed",    ctaKey: "notifCtaFixPayment",    category: "payments", actionable: true },
  payment_refunded:       { icon: CreditCard,    tone: "bg-yellow-500/20 text-yellow-300", labelKey: "notifTypePaymentRefunded", ctaKey: "notifCtaViewPayment",  category: "payments" },
  dj_application_submitted: { icon: UserPlus,    tone: "bg-cyan-500/20 text-cyan-300",   labelKey: "notifTypeAppSubmitted",     ctaKey: "notifCtaViewApplication", category: "updates" },
  dj_application_approved:  { icon: Award,       tone: "bg-emerald-500/20 text-emerald-300", labelKey: "notifTypeAppApproved",   ctaKey: "notifCtaViewApplication", category: "updates" },
  dj_application_rejected:  { icon: X,           tone: "bg-red-500/20 text-red-300",     labelKey: "notifTypeAppRejected",      ctaKey: "notifCtaViewApplication", category: "updates" },
  new_message:            { icon: MessageCircle, tone: "bg-indigo-500/20 text-indigo-300", labelKey: "notifTypeNewMessage",      ctaKey: "notifCtaReply",         category: "messages", actionable: true },
  new_review:             { icon: Star,          tone: "bg-yellow-500/20 text-yellow-300", labelKey: "notifTypeNewReview",       ctaKey: "notifCtaReadReview",    category: "reviews" },
  review_request:         { icon: Star,          tone: "bg-yellow-500/20 text-yellow-300", labelKey: "notifTypeReviewRequest",   ctaKey: "notifCtaLeaveReview",   category: "reviews", actionable: true },
  system_alert:           { icon: AlertCircle,   tone: "bg-red-500/20 text-red-300",     labelKey: "notifTypeSystemAlert",      ctaKey: "notifCtaLearnMore",     category: "updates" },
  reminder:               { icon: Clock,         tone: "bg-blue-500/20 text-blue-300",   labelKey: "notifTypeReminder",         ctaKey: "notifCtaOpen",          category: "updates", actionable: true },
  promotional:            { icon: Bell,          tone: "bg-pink-500/20 text-pink-300",   labelKey: "notifTypePromotion",        ctaKey: "notifCtaTakeLook",      category: "updates" },
};

// Meta lookup that returns translation KEYS (not resolved strings).
// The resolver lives in `useMeta` below.
const metaKeysFor = (type) =>
  TYPE_META[type] || {
    icon: Bell,
    tone: "bg-zinc-500/20 text-zinc-300",
    labelKey: null,
    fallbackLabel: prettifyType(type),
    ctaKey: "notifCtaOpen",
    category: "updates",
  };

const prettifyType = (type) =>
  type ? type.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "Notification";

// Hook that resolves a type's metadata into translated strings.
// Use inside any component that already has `t`.
function useMeta(t) {
  return useCallback(
    (type) => {
      const keys = metaKeysFor(type);
      return {
        icon: keys.icon,
        tone: keys.tone,
        category: keys.category,
        actionable: keys.actionable,
        label: keys.labelKey ? t(keys.labelKey) : (keys.fallbackLabel || t("notificationFallback")),
        cta: t(keys.ctaKey || "notifCtaOpen"),
      };
    },
    [t]
  );
}

const CATEGORIES = [
  { id: "all",      labelKey: "catAll" },
  { id: "bookings", labelKey: "catBookings" },
  { id: "payments", labelKey: "catPayments" },
  { id: "messages", labelKey: "catMessages" },
  { id: "reviews",  labelKey: "catReviews" },
  { id: "updates",  labelKey: "catUpdates" },
];

const FILTERS = [
  { id: "all",    labelKey: "filterAll" },
  { id: "unread", labelKey: "filterUnread" },
  { id: "read",   labelKey: "filterRead" },
];

// ============================================
// HELPERS
// ============================================

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case "high":   return "text-red-300 bg-red-500/15";
    case "medium": return "text-yellow-300 bg-yellow-500/15";
    case "low":    return "text-green-300 bg-green-500/15";
    default:       return "text-zinc-400 bg-zinc-500/10";
  }
};

// `meta` is the resolved meta object (has `.actionable`) so this stays pure
const needsAttention = (n, meta) =>
  !n.read && (n.priority?.toLowerCase() === "high" || !!meta.actionable);

const formatTime = (dateString, t) => {
  if (!dateString) return t("timeJustNow");

  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMs < 60000) return t("timeJustNow");
  if (diffMins < 60) return `${diffMins}${t("timeMinutesShort")}`;
  if (diffHours < 24) return `${diffHours}${t("timeHoursShort")}`;
  if (diffDays < 7)  return `${diffDays}${t("timeDaysShort")}`;
  if (diffWeeks < 4) return `${diffWeeks}${t("timeWeeksShort")}`;
  if (diffMonths < 12) return `${diffMonths}${t("timeMonthsShort")}`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const dayLabelFor = (dateString, t) => {
  if (!dateString) return t("dayToday");
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return t("dayEarlier");
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const dStart = new Date(d);
  dStart.setHours(0, 0, 0, 0);
  const diff = Math.round((start - dStart) / 86400000);
  if (diff <= 0) return t("dayToday");
  if (diff === 1) return t("dayYesterday");
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return t("dayEarlier");
};

const groupByDay = (list, t) => {
  const map = new Map();
  list.forEach((n) => {
    const label = dayLabelFor(n.created_at, t);
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(n);
  });
  return Array.from(map, ([label, items]) => ({ label, items }));
};

const getTokenExpiry = (token) => {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = part + "=".repeat((4 - (part.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

class AuthError extends Error {
  constructor(fromServer = false) {
    super("Your session has expired. Please log in again.");
    this.name = "AuthError";
    this.fromServer = fromServer;
  }
}

// ---- Streak (device-local) ----
const pad = (v) => String(v).padStart(2, "0");
const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const readStreak = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STREAK_KEY));
    if (raw && typeof raw.count === "number") return raw;
  } catch {}
  return { count: 0, last: null };
};

const bumpStreak = () => {
  const s = readStreak();
  const today = dayKey();
  if (s.last === today) return s;
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const next = { count: s.last === yesterday ? s.count + 1 : 1, last: today };
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(next)); } catch {}
  return next;
};

const CONFETTI = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const radius = 46 + (i % 3) * 16;
  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
    color: ["#a855f7", "#34d399", "#fbbf24", "#60a5fa"][i % 4],
    delay: (i % 4) * 40,
  };
});

const STYLES = `
.gz-noscroll{scrollbar-width:none}
.gz-noscroll::-webkit-scrollbar{display:none}
@keyframes gz-enter{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes gz-pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
@keyframes gz-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.6);opacity:0}}
@keyframes gz-burst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--x),var(--y)) scale(.4);opacity:0}}
.gz-enter{animation:gz-enter .35s ease-out both}
.gz-pop{animation:gz-pop .2s ease-out both}
.gz-ring{animation:gz-ring 1.8s ease-in-out infinite}
.gz-confetti{animation:gz-burst .9s ease-out forwards}
@media (prefers-reduced-motion: reduce){
  .gz-enter,.gz-pop,.gz-ring,.gz-confetti{animation:none}
}
`;

// ============================================
// PRESENTATIONAL COMPONENTS
// ============================================

const NotificationCard = memo(function NotificationCard({
  n,
  timeLabel,
  featured,
  enterIndex,
  onOpen,
  onMarkRead,
  onDelete,
  meta,
  t,
}) {
  const Icon = meta.icon;
  const unread = !n.read;
  const urgent = unread && n.priority?.toLowerCase() === "high";
  const showCta = !!n.action_url && (featured || unread);

  return (
    <article
      onClick={() => onOpen(n)}
      style={enterIndex != null ? { animationDelay: `${enterIndex * 45}ms` } : undefined}
      className={`relative rounded-2xl border p-4 cursor-pointer transition-colors ${
        enterIndex != null ? "gz-enter" : ""
      } ${
        featured
          ? "bg-gradient-to-br from-purple-600/20 via-zinc-900 to-zinc-900 border-purple-500/40 hover:border-purple-400/70"
          : unread
          ? "bg-purple-500/5 border-purple-500/30 hover:border-purple-500/60"
          : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {unread && !featured && (
        <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-purple-500" />
      )}

      <div className="flex gap-4">
        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${meta.tone}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="min-w-0">
                <button
                  type="button"
                  className={`block max-w-full truncate text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                    unread ? "font-semibold text-white" : "font-medium text-zinc-300"
                  }`}
                >
                  {n.title}
                </button>
              </h3>
              <span className="text-xs text-zinc-500">{meta.label}</span>
            </div>
            <span
              className="text-xs text-zinc-500 whitespace-nowrap pt-0.5"
              title={n.created_at ? new Date(n.created_at).toLocaleString() : undefined}
            >
              {timeLabel}
            </span>
          </div>

          <p className="text-sm text-zinc-400 mt-1.5">{n.message}</p>

          <div
            className="flex items-center justify-between gap-2 mt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0">
              {urgent && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getPriorityColor(n.priority)}`}>
                  {t("urgent")}
                </span>
              )}
              {showCta &&
                (featured ? (
                  <button
                    type="button"
                    onClick={() => onOpen(n)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                  >
                    {meta.cta}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpen(n)}
                    className="text-sm font-medium text-purple-300 hover:text-purple-200 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
                  >
                    {meta.cta}
                  </button>
                ))}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {unread && (
                <button
                  type="button"
                  onClick={() => onMarkRead(n.id)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-purple-300 hover:bg-purple-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  title={t("markAsRead")}
                  aria-label={t("markAsRead")}
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(n.id)}
                className="p-2 rounded-lg text-zinc-500 hover:text-red-300 hover:bg-red-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                title={t("deleteNotification")}
                aria-label={t("deleteNotification")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

function NotificationSkeleton() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{t("loadingNotifications")}</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 flex gap-4 animate-pulse">
          <div className="w-11 h-11 rounded-xl bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-zinc-800 rounded" />
            <div className="h-3 w-full bg-zinc-800/70 rounded" />
            <div className="h-3 w-1/2 bg-zinc-800/70 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StateCard({ icon: Icon, iconClass, title, body, children }) {
  return (
    <div className="mt-16 text-center px-2">
      <div className={`rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 ${iconClass}`}>
        <Icon className="w-9 h-9" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-xs mx-auto">{body}</p>
      {children && <div className="mt-5 flex items-center justify-center gap-3">{children}</div>}
    </div>
  );
}

function CaughtUpBanner({ streak, t }) {
  return (
    <div
      role="status"
      className="gz-pop relative overflow-hidden mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3"
    >
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="gz-confetti absolute left-9 top-1/2 w-1.5 h-1.5 rounded-full"
          style={{
            "--x": `${c.x}px`,
            "--y": `${c.y}px`,
            background: c.color,
            animationDelay: `${c.delay}ms`,
          }}
        />
      ))}
      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-white">{t("inboxCleared")}</p>
        <p className="text-sm text-zinc-400">
          {streak >= 2 ? t("inboxClearedStreak").replace("{n}", streak) : t("inboxClearedSolo")}
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN
// ============================================

export function NotificationsScreen() {
  const { getToken, logout } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const metaFor = useMeta(t);

  const getTokenRef = useRef(getToken);
  const logoutRef = useRef(logout);
  const navigateRef = useRef(navigate);
  getTokenRef.current = getToken;
  logoutRef.current = logout;
  navigateRef.current = navigate;

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState(null);
  const [authExpired, setAuthExpired] = useState(false);
  const [incoming, setIncoming] = useState(0);
  const [toast, setToast] = useState(null);
  const [streak, setStreak] = useState(readStreak);
  const [celebrate, setCelebrate] = useState(false);
  const [revealing, setRevealing] = useState(true);
  const [tick, setTick] = useState(0);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const pageRef = useRef(0);
  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const authExpiredRef = useRef(false);
  const baselineRef = useRef(0);
  const mutationsRef = useRef(0);
  const pendingDeletesRef = useRef(new Map());
  const toastTimerRef = useRef(null);
  const celebrateTimerRef = useRef(null);
  const prevUnreadRef = useRef(null);
  const sentinelRef = useRef(null);

  const apiFetch = useCallback(async (path, options = {}) => {
    const token = getTokenRef.current?.();
    const exp = token ? getTokenExpiry(token) : null;
    if (!token || (exp && Date.now() >= exp)) throw new AuthError(false);

    const res = await fetch(`${BASE_API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) throw new AuthError(true);
    return res;
  }, []);

  const handleAuthFailure = useCallback((err) => {
    if (authExpiredRef.current) return;
    authExpiredRef.current = true;
    setAuthExpired(true);
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
    if (err?.fromServer) logoutRef.current?.();
  }, []);

  const showToast = useCallback(
    (message, { tone = "info", actionLabel, onAction, duration = 4000 } = {}) => {
      clearTimeout(toastTimerRef.current);
      setToast({ id: Date.now(), message, tone, actionLabel, onAction });
      toastTimerRef.current = setTimeout(() => setToast(null), duration);
    },
    []
  );

  const loadNotifications = useCallback(
    async (reset = true, { silent = false } = {}) => {
      if (!reset && loadingMoreRef.current) return;
      const reqId = ++requestIdRef.current;

      if (reset) {
        pageRef.current = 0;
        loadingMoreRef.current = false;
        setLoadingMore(false);
        if (silent) setRefreshing(true);
        else setLoading(true);
      } else {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: String(LIMIT),
          offset: String(pageRef.current * LIMIT),
        });
        if (filter === "unread") params.set("unread_only", "true");

        const res = await apiFetch(`/api/notifications?${params}`);

        if (res.status === 403) throw new Error(t("notifNoPermission"));

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || t("notifLoadFailed"));
        if (reqId !== requestIdRef.current) return;

        const list = Array.isArray(data.notifications) ? data.notifications : [];
        pageRef.current += 1;

        if (reset) {
          const unread =
            typeof data.unreadCount === "number"
              ? data.unreadCount
              : list.filter((n) => !n.read).length;
          setItems(list);
          setUnreadCount(unread);
          baselineRef.current = unread;
          setIncoming(0);
          hasLoadedRef.current = true;
          setHasLoaded(true);
        } else {
          setItems((prev) => {
            const seen = new Set(prev.map((n) => n.id));
            return [...prev, ...list.filter((n) => !seen.has(n.id))];
          });
        }
        setHasMore(list.length === LIMIT);
      } catch (err) {
        if (reqId !== requestIdRef.current) return;
        if (err instanceof AuthError) handleAuthFailure(err);
        else setError(err.message || t("notifLoadError"));
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [filter, apiFetch, handleAuthFailure, t]
  );

  const pollUnread = useCallback(async () => {
    if (
      document.hidden ||
      !hasLoadedRef.current ||
      authExpiredRef.current ||
      mutationsRef.current > 0 ||
      pendingDeletesRef.current.size > 0
    ) {
      return;
    }
    try {
      const res = await apiFetch("/api/notifications/unread-count");
      if (!res.ok) return;
      const data = await res.json();
      const count = Number(data.count) || 0;
      setUnreadCount(count);
      if (count > baselineRef.current) setIncoming(count - baselineRef.current);
      else { baselineRef.current = count; setIncoming(0); }
    } catch (err) {
      if (err instanceof AuthError) handleAuthFailure(err);
    }
  }, [apiFetch, handleAuthFailure]);

  const markAsRead = useCallback(
    async (id) => {
      const target = itemsRef.current.find((n) => n.id === id);
      if (!target || target.read) return;

      const readAt = new Date().toISOString();
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, read_at: readAt } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      baselineRef.current = Math.max(0, baselineRef.current - 1);

      mutationsRef.current += 1;
      try {
        const res = await apiFetch(`/api/notifications/${id}/read`, { method: "PUT" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || t("notifMarkReadFailed"));
        }
      } catch (err) {
        if (err instanceof AuthError) {
          handleAuthFailure(err);
        } else {
          setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: false, read_at: null } : n)));
          setUnreadCount((c) => c + 1);
          baselineRef.current += 1;
          showToast(err.message || t("notifMarkReadFailed"), { tone: "error" });
        }
      } finally {
        mutationsRef.current -= 1;
      }
    },
    [apiFetch, handleAuthFailure, showToast, t]
  );

  const markAllAsRead = useCallback(async () => {
    if (markingAll) return;
    setMarkingAll(true);
    mutationsRef.current += 1;
    try {
      const res = await apiFetch("/api/notifications/read-all", { method: "PUT" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || t("notifMarkAllFailed"));
      }
      const readAt = new Date().toISOString();
      setItems((prev) => prev.map((n) => (n.read ? n : { ...n, read: true, read_at: readAt })));
      setUnreadCount(0);
      baselineRef.current = 0;
      setIncoming(0);
    } catch (err) {
      if (err instanceof AuthError) handleAuthFailure(err);
      else showToast(err.message, { tone: "error" });
    } finally {
      mutationsRef.current -= 1;
      setMarkingAll(false);
    }
  }, [markingAll, apiFetch, handleAuthFailure, showToast, t]);

  const restoreItem = useCallback(({ item, index }) => {
    setItems((prev) => {
      if (prev.some((n) => n.id === item.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, item);
      return next;
    });
    if (!item.read) {
      setUnreadCount((c) => c + 1);
      baselineRef.current += 1;
    }
  }, []);

  const commitDelete = useCallback(
    async (id) => {
      const pending = pendingDeletesRef.current.get(id);
      if (!pending) return;
      pendingDeletesRef.current.delete(id);
      try {
        const res = await apiFetch(`/api/notifications/${id}`, { method: "DELETE" });
        if (!res.ok && res.status !== 404) throw new Error("Delete failed");
      } catch (err) {
        if (err instanceof AuthError) {
          handleAuthFailure(err);
          return;
        }
        restoreItem(pending);
        showToast(t("notifDeleteFailed"), { tone: "error" });
      }
    },
    [apiFetch, handleAuthFailure, restoreItem, showToast, t]
  );

  const deleteNotification = useCallback(
    (id) => {
      const index = itemsRef.current.findIndex((n) => n.id === id);
      if (index === -1) return;
      const item = itemsRef.current[index];

      setItems((prev) => prev.filter((n) => n.id !== id));
      if (!item.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
        baselineRef.current = Math.max(0, baselineRef.current - 1);
      }

      const timer = setTimeout(() => commitDelete(id), UNDO_MS);
      pendingDeletesRef.current.set(id, { timer, item, index });

      showToast(t("notifDeleted"), {
        actionLabel: t("undo"),
        duration: UNDO_MS,
        onAction: () => {
          const pending = pendingDeletesRef.current.get(id);
          if (!pending) return;
          clearTimeout(pending.timer);
          pendingDeletesRef.current.delete(id);
          restoreItem(pending);
        },
      });
    },
    [commitDelete, restoreItem, showToast, t]
  );

  const handleOpen = useCallback(
    (n) => {
      if (!n.read) markAsRead(n.id);
      if (n.action_url) navigateRef.current(n.action_url);
    },
    [markAsRead]
  );

  const handleShowNew = () => {
    setIncoming(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadNotifications(true, { silent: true });
  };

  const handleRefresh = () => {
    if (loading || refreshing) return;
    loadNotifications(true, { silent: true });
  };

  const resetFilters = () => {
    setFilter("all");
    setCategory("all");
  };

  useEffect(() => { loadNotifications(true); }, [loadNotifications]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || loading || loadingMore || !hasMore || error || authExpired) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadNotifications(false); },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, error, authExpired, items.length, loadNotifications]);

  useEffect(() => {
    const interval = setInterval(pollUnread, POLL_MS);
    const onVisible = () => { if (!document.hidden) pollUnread(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pollUnread]);

  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    const id = setTimeout(() => setRevealing(false), 1500);
    return () => clearTimeout(id);
  }, [hasLoaded]);

  useEffect(() => {
    if (!hasLoaded || loading || authExpired) return;
    const prev = prevUnreadRef.current;
    prevUnreadRef.current = unreadCount;

    if (unreadCount === 0) {
      setStreak(bumpStreak());
      if (prev !== null && prev > 0) {
        setCelebrate(true);
        clearTimeout(celebrateTimerRef.current);
        celebrateTimerRef.current = setTimeout(() => setCelebrate(false), 6000);
      }
    }
  }, [unreadCount, hasLoaded, loading, authExpired]);

  useEffect(() => {
    const pendingDeletes = pendingDeletesRef.current;
    return () => {
      pendingDeletes.forEach(({ timer }, id) => {
        clearTimeout(timer);
        apiFetch(`/api/notifications/${id}`, { method: "DELETE" }).catch(() => {});
      });
      pendingDeletes.clear();
      clearTimeout(toastTimerRef.current);
      clearTimeout(celebrateTimerRef.current);
    };
  }, [apiFetch]);

  // ─── Derived ─────────────────────────────────

  const visible = useMemo(
    () =>
      items.filter((n) => {
        if (filter === "read" && !n.read) return false;
        if (category !== "all" && metaFor(n.type).category !== category) return false;
        return true;
      }),
    [items, filter, category, metaFor]
  );

  const attention = useMemo(
    () => (filter === "read" ? [] : visible.filter((n) => needsAttention(n, metaFor(n.type))).slice(0, 3)),
    [visible, filter, metaFor]
  );

  const rest = useMemo(() => {
    const pinned = new Set(attention.map((n) => n.id));
    return visible.filter((n) => !pinned.has(n.id));
  }, [visible, attention]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const groups = useMemo(() => groupByDay(rest, t), [rest, tick, t]);

  const attentionTotal = useMemo(
    () => items.filter((n) => needsAttention(n, metaFor(n.type))).length,
    [items, metaFor]
  );

  const categoryUnread = useMemo(() => {
    const counts = {};
    items.forEach((n) => {
      if (!n.read) {
        const c = metaFor(n.type).category;
        counts[c] = (counts[c] || 0) + 1;
      }
    });
    return counts;
  }, [items, metaFor]);

  const streakInfo = useMemo(() => {
    const today = dayKey();
    const yesterday = dayKey(new Date(Date.now() - 86400000));
    if (streak.last === today) return { count: streak.count, atRisk: false };
    if (streak.last === yesterday) return { count: streak.count, atRisk: true };
    return { count: 0, atRisk: false };
  }, [streak, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const subline = (() => {
    if (authExpired) return t("sublineExpired");
    if (!hasLoaded) return t("sublineLoaded");
    if (unreadCount === 0) return t("sublineCaughtUp");
    if (streakInfo.atRisk && streakInfo.count >= 2) {
      return t("sublineKeepStreak").replace("{n}", streakInfo.count);
    }
    if (attentionTotal > 0) {
      return t("sublineUnreadAttention")
        .replace("{unread}", unreadCount)
        .replace("{attention}", attentionTotal);
    }
    return t("sublineUnread").replace("{n}", unreadCount);
  })();

  const emptyCopy = (() => {
    if (filter === "unread") return { title: t("emptyUnreadTitle"), body: t("emptyUnreadBody") };
    if (filter === "read") return { title: t("emptyReadTitle"), body: t("emptyReadBody") };
    if (category !== "all") {
      const label = t(CATEGORIES.find((c) => c.id === category)?.labelKey).toLowerCase();
      return {
        title: t("emptyCategoryTitle").replace("{label}", label),
        body: t("emptyCategoryBody"),
      };
    }
    return { title: t("emptyAllTitle"), body: t("emptyAllBody") };
  })();

  let enterCounter = 0;
  const nextEnter = () => (revealing && enterCounter < 8 ? enterCounter++ : undefined);

  const renderCard = (n, featured = false) => (
    <NotificationCard
      key={n.id}
      n={n}
      featured={featured}
      timeLabel={formatTime(n.created_at, t)}
      enterIndex={nextEnter()}
      onOpen={handleOpen}
      onMarkRead={markAsRead}
      onDelete={deleteNotification}
      meta={metaFor(n.type)}
      t={t}
    />
  );

  // ─── Body ─────────────────────────────────
  let body;

  if (loading) {
    body = <NotificationSkeleton />;
  } else if (authExpired) {
    body = (
      <StateCard
        icon={LogOut}
        iconClass="bg-yellow-500/10 text-yellow-400"
        title={t("sessionExpiredTitle")}
        body={t("sessionExpiredBody")}
      >
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-500 transition-colors"
        >
          {t("loginAction")}
        </button>
      </StateCard>
    );
  } else if (error && items.length === 0) {
    body = (
      <StateCard
        icon={AlertCircle}
        iconClass="bg-red-500/10 text-red-400"
        title={t("loadErrorTitle")}
        body={error}
      >
        <button
          type="button"
          onClick={() => loadNotifications(true)}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-500 transition-colors"
        >
          {t("tryAgain")}
        </button>
      </StateCard>
    );
  } else if (visible.length === 0 && !hasMore) {
    body = (
      <StateCard
        icon={Bell}
        iconClass="bg-zinc-900 text-zinc-600"
        title={emptyCopy.title}
        body={emptyCopy.body}
      >
        {(filter !== "all" || category !== "all") && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-medium text-purple-300 hover:text-purple-200"
          >
            {t("showEverything")}
          </button>
        )}
      </StateCard>
    );
  } else {
    body = (
      <>
        {attention.length > 0 && (
          <section aria-labelledby="gz-attention" className="mb-8">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="relative flex w-2.5 h-2.5" aria-hidden="true">
                <span className="gz-ring absolute inset-0 rounded-full bg-purple-500" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-purple-400" />
              </span>
              <h2 id="gz-attention" className="text-sm font-semibold text-white">
                {t("needsAttention")}
              </h2>
            </div>
            <div className="space-y-3">{attention.map((n) => renderCard(n, true))}</div>
          </section>
        )}

        {groups.map((g) => (
          <section key={g.label} className="mb-6">
            <h2 className="text-sm font-semibold text-zinc-400 mb-3">{g.label}</h2>
            <div className="space-y-3">{g.items.map((n) => renderCard(n))}</div>
          </section>
        ))}

        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-6 min-h-[56px]">
            {loadingMore && <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />}
          </div>
        )}

        {error && items.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-zinc-500 mb-2">{error}</p>
            <button
              type="button"
              onClick={() => loadNotifications(false)}
              className="text-sm font-medium text-purple-300 hover:text-purple-200"
            >
              {t("tryAgain")}
            </button>
          </div>
        )}

        {!hasMore && visible.length > 0 && (
          <p className="text-center text-sm text-zinc-600 py-6">{t("thatsEverything")}</p>
        )}
      </>
    );
  }

  // ─── Render ─────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <style>{STYLES}</style>

      <header className="sticky top-0 z-20 bg-black/85 backdrop-blur-md border-b border-zinc-900">
        <div className="bg-gradient-to-b from-purple-900/30 to-transparent px-6 pt-6 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white">{t("notificationsTitle")}</h1>
              <p className="text-sm text-zinc-400 mt-0.5">{subline}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {streakInfo.count >= 2 && (
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-300 text-xs font-semibold"
                  title={t("streakTooltip").replace("{n}", streakInfo.count)}
                >
                  <Flame className="w-3.5 h-3.5" />
                  {streakInfo.count}
                </div>
              )}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                aria-label={t("refresh")}
                title={t("refresh")}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {incoming > 0 && !authExpired && (
            <button
              type="button"
              onClick={handleShowNew}
              className="gz-pop mt-3 w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
            >
              {incoming === 1
                ? t("showOneNew").replace("{n}", incoming)
                : t("showManyNew").replace("{n}", incoming)}
            </button>
          )}

          <div className="flex items-center justify-between gap-3 mt-4">
            <div role="tablist" aria-label={t("filterByReadState")} className="flex bg-zinc-900 rounded-full p-1">
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                      active ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {t(f.labelKey)}
                    {f.id === "unread" && unreadCount > 0 && ` (${unreadCount})`}
                  </button>
                );
              })}
            </div>

            {unreadCount > 0 && !authExpired && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
              >
                {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                {markingAll ? t("markingAll") : t("markAllAsRead")}
              </button>
            )}
          </div>

          <div className="gz-noscroll flex items-center gap-2 mt-3 overflow-x-auto -mx-6 px-6 pb-1">
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              const count = c.id === "all" ? 0 : categoryUnread[c.id] || 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                    active
                      ? "bg-white text-black border-white"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {t(c.labelKey)}
                  {count > 0 && (
                    <span
                      className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center ${
                        active ? "bg-black text-white" : "bg-purple-500 text-white"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="px-6 pt-5">
        {celebrate && !loading && <CaughtUpBanner streak={streakInfo.count} t={t} />}
        {body}
      </main>

      {toast && (
        <div
          className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div
            key={toast.id}
            role="status"
            className={`gz-pop pointer-events-auto flex items-center gap-3 rounded-full pl-5 pr-2 py-2 shadow-xl border text-sm ${
              toast.tone === "error"
                ? "bg-red-950 border-red-500/40 text-red-100"
                : "bg-zinc-900 border-zinc-700 text-white"
            }`}
          >
            <span>{toast.message}</span>
            {toast.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  clearTimeout(toastTimerRef.current);
                  setToast(null);
                }}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 font-semibold text-purple-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsScreen;