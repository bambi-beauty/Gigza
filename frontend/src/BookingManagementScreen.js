// BookingManagementScreen.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Calendar, Clock, Users, Timer, Loader2, AlertCircle, CheckCircle, XCircle,
  Bell, ArrowLeft, X, Headphones,
} from "lucide-react";
import { getUserBookings, cancelBooking } from "./services/bookingService";
import { useUser } from "./UserContext/ThisUserContext";
import { useSocket } from "./UserContext/SocketContext";
import { useTranslation } from "./hooks/useTranslation";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const btnPrimary =
  "rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium " +
  "shadow-lg shadow-purple-900/30 hover:from-purple-500 hover:to-fuchsia-500 transition " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const btnGhost =
  "rounded-lg border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 hover:border-white/20 transition " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400";

// Status styles — labels become translation keys
const STATUS_STYLES = {
  confirmed: { labelKey: "statusConfirmed", classes: "bg-green-500/15 text-green-400 border-green-500/30", Icon: CheckCircle },
  pending:   { labelKey: "statusPending",   classes: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", Icon: Clock },
  cancelled: { labelKey: "statusCancelled", classes: "bg-red-500/15 text-red-400 border-red-500/30", Icon: XCircle },
  completed: { labelKey: "statusCompleted", classes: "bg-blue-500/15 text-blue-400 border-blue-500/30", Icon: CheckCircle },
};

const TABS = [
  { key: "upcoming",  labelKey: "tabUpcoming",  match: (s) => s === "pending" || s === "confirmed" },
  { key: "completed", labelKey: "tabCompleted", match: (s) => s === "completed" },
  { key: "cancelled", labelKey: "tabCancelled", match: (s) => s === "cancelled" },
  { key: "all",       labelKey: "tabAll",       match: () => true },
];

const EMPTY_COPY = {
  upcoming:  { titleKey: "emptyUpcomingTitle",  bodyKey: "emptyUpcomingBody" },
  completed: { titleKey: "emptyCompletedTitle", bodyKey: "emptyCompletedBody" },
  cancelled: { titleKey: "emptyCancelledTitle", bodyKey: "emptyCancelledBody" },
  all:       { titleKey: "emptyAllTitle",       bodyKey: "emptyAllBody" },
};

const normalizeBooking = (b) => {
  const hours = Number(b.duration_hours ?? b.durationHours) || 0;
  const explicitTotal = Number(b.total_price ?? b.totalPrice);
  const perHour = Number(b.price_per_hour ?? b.pricePerHour) || 0;

  return {
    raw: b,
    id: b.booking_id || b.id,
    djId: b.dj_id || b.djId,
    djName: b.dj_name || b.dj?.name || "DJ",
    status: String(b.booking_status || b.status || "pending").toLowerCase(),
    eventType: b.event_type || b.eventType || "Event",
    date: b.event_date || b.eventDate || null,
    time: b.event_time || b.eventTime || null,
    hours,
    guests: Number(b.number_of_guests ?? b.numberOfGuests) || 0,
    total: explicitTotal > 0 ? explicitTotal : perHour * hours,
  };
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return isNaN(d) ? null : d;
};

const formatDate = (value, t) => {
  if (!value) return t("dateTBD");
  const d = parseDate(value);
  if (!d) return t("dateTBD");
  return d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
};

const formatTime = (value, t) => {
  if (!value) return t("timeTBD");
  if (typeof value === "string" && value.includes(":") && !value.includes("T")) return value.substring(0, 5);
  const d = new Date(value);
  return isNaN(d) ? t("timeTBD") : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

const friendlyError = (err, fallback, map) => {
  const status = err?.status;
  const msg = err?.message || "";
  for (const [code, text] of Object.entries(map)) {
    if (status === Number(code) || msg.includes(code)) return text;
  }
  return msg && !msg.includes("fetch") ? msg : fallback;
};

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function StatusBadge({ status, t }) {
  const style = STATUS_STYLES[status] || {
    labelKey: null,
    fallbackLabel: status,
    classes: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    Icon: null,
  };
  const { Icon } = style;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${style.classes}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {style.labelKey ? t(style.labelKey) : style.fallbackLabel}
    </span>
  );
}

function BookingCard({ booking, cancelling, onCancel, t }) {
  const { id, djId, djName, status, eventType, date, time, hours, guests, total } = booking;
  const canCancel = status === "pending" || status === "confirmed";

  const details = [
    { Icon: Calendar, text: formatDate(date, t) },
    { Icon: Clock,    text: formatTime(time, t) },
    { Icon: Timer,    text: hours ? `${hours} ${hours === 1 ? t("hour") : t("hours")}` : t("durationTBD") },
    { Icon: Users,    text: `${guests} ${guests === 1 ? t("guest") : t("guests")}` },
  ];

  return (
    <article className="bg-zinc-900 border border-white/10 rounded-2xl p-5 hover:border-white/25 transition">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-900/30 shrink-0">
            <span className="text-white font-bold text-lg">{djName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-lg truncate">{djName}</h3>
            <p className="text-sm text-purple-300 truncate">{eventType}</p>
          </div>
        </div>
        <StatusBadge status={status} t={t} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-white/5 border border-white/5 rounded-xl p-4 mb-4">
        {details.map(({ Icon, text }, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <Icon className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-sm text-zinc-300 truncate">{text}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
        <span className="text-zinc-500 text-sm">{t("totalPrice")}</span>
        <span className="text-white font-bold text-xl">R{total.toLocaleString()}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {status === "completed" && (
          <Link to={`/review/${id}`} className={`${btnPrimary} flex-1 min-w-[8rem] py-2.5 text-sm text-center`}>
            {t("leaveReview")}
          </Link>
        )}
        {canCancel && (
          <button
            onClick={() => onCancel(booking)}
            disabled={cancelling}
            className="flex-1 min-w-[8rem] rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t("cancelBooking")}
          </button>
        )}
        <Link to={`/dj/${djId}`} className={`${btnGhost} flex-1 min-w-[8rem] py-2.5 text-sm text-center`}>
          {t("viewDJProfile")}
        </Link>
      </div>
    </article>
  );
}

function CancelDialog({ booking, busy, onConfirm, onClose, t }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-title"
    >
      <div
        className="bg-zinc-900 w-full max-w-md rounded-2xl border border-white/10 shadow-2xl shadow-black/60 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 id="cancel-title" className="font-semibold text-lg">{t("cancelDialogTitle")}</h2>
            <p className="text-zinc-400 text-sm mt-1">
              {t("cancelDialogBodyPre")}{" "}
              <span className="text-white">{booking.djName}</span>{" "}
              {t("cancelDialogBodyOn")} {formatDate(booking.date, t)} {t("cancelDialogBodyPost")}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={busy} className={`${btnGhost} flex-1 py-2.5 text-sm disabled:opacity-50`}>
            {t("keepBooking")}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 text-white py-2.5 text-sm font-medium transition disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t("yesCancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingSkeletons() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-zinc-900 border border-white/10 rounded-2xl p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-zinc-800 rounded-full w-1/3" />
              <div className="h-3 bg-zinc-800 rounded-full w-1/4" />
            </div>
          </div>
          <div className="h-24 bg-zinc-800 rounded-xl mb-4" />
          <div className="h-10 bg-zinc-800 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export function BookingManagementScreen() {
  const { getToken } = useUser();
  const { socket, isConnected, notifications, unreadCount, markAllAsRead } = useSocket();
  const { t } = useTranslation();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        if (!getToken()) {
          setError(t("loginToViewBookings"));
          setBookings([]);
          return;
        }

        const data = await getUserBookings();

        if (Array.isArray(data)) {
          setBookings(data);
        } else if (data?.bookings) {
          setBookings(data.bookings);
        } else {
          setBookings([]);
          if (data?.message) setError(data.message);
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError(
          friendlyError(err, t("bookingsLoadFailed"), {
            401: t("sessionExpiredMsg"),
            403: t("noPermissionBookings"),
            404: t("bookingsServiceNotFound"),
            NetworkError: t("networkError"),
          })
        );
        if (!silent) setBookings([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [getToken, t]
  );

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const refresh = () => fetchBookings({ silent: true });
    const events = ["booking:confirmed", "booking:cancelled", "booking:completed", "booking:created"];

    events.forEach((evt) => socket.on(evt, refresh));
    return () => events.forEach((evt) => socket.off(evt, refresh));
  }, [socket, isConnected, fetchBookings]);

  const normalized = useMemo(() => bookings.map(normalizeBooking), [bookings]);

  const counts = useMemo(() => {
    const result = {};
    TABS.forEach((tab) => {
      result[tab.key] = normalized.filter((b) => tab.match(b.status)).length;
    });
    return result;
  }, [normalized]);

  const visible = useMemo(() => {
    const tab = TABS.find((x) => x.key === activeTab) || TABS[0];
    const list = normalized.filter((b) => tab.match(b.status));
    const time = (b) => parseDate(b.date)?.getTime() ?? Infinity;
    return [...list].sort((a, b) => (activeTab === "upcoming" ? time(a) - time(b) : time(b) - time(a)));
  }, [normalized, activeTab]);

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    const { id } = pendingCancel;

    setCancellingId(id);
    setActionError(null);
    try {
      await cancelBooking(id);
      setPendingCancel(null);
      await fetchBookings({ silent: true });
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setPendingCancel(null);
      setActionError(
        friendlyError(err, t("bookingCancelFailed"), {
          401: t("sessionExpiredMsg"),
          403: t("noPermissionCancel"),
          404: t("bookingNotFound"),
        })
      );
    } finally {
      setCancellingId(null);
    }
  };

  const emptyCopy = EMPTY_COPY[activeTab];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t("backToDJs")}</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              aria-label={unreadCount > 0 ? `${t("navNotifications")}, ${unreadCount} ${t("unreadLower")}` : t("navNotifications")}
              aria-expanded={showNotifications}
              className="relative p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2.5rem)] bg-zinc-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-20 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-white/10 flex items-center justify-between sticky top-0 bg-zinc-900">
                    <span className="font-medium">{t("navNotifications")}</span>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-purple-400 text-xs hover:text-purple-300 transition">
                          {t("markAllAsRead")}
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        aria-label={t("close")}
                        className="text-zinc-500 hover:text-white transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-zinc-500 text-sm">{t("noNotificationsYet")}</div>
                  ) : (
                    notifications.map((notif, index) => (
                      <div
                        key={notif.id || index}
                        className={`p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition ${!notif.read ? "bg-purple-500/5" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium">{notif.title}</p>
                            <p className="text-zinc-400 text-xs">{notif.message}</p>
                            <p className="text-zinc-500 text-xs mt-1">
                              {notif.timestamp ? new Date(notif.timestamp).toLocaleString() : t("timeJustNow")}
                            </p>
                          </div>
                          {!notif.read && <span className="w-2 h-2 bg-purple-500 rounded-full shrink-0 mt-1.5" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Title */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] max-w-full h-64 rounded-full bg-purple-600/20 blur-3xl"
        />
        <div className="relative max-w-3xl mx-auto px-5 py-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t("myBookingsTitle")}</h1>
          <p className="text-zinc-400 mt-1">{t("myBookingsSubtitle")}</p>

          <div className="mt-3 flex items-center gap-1.5 text-xs" role="status">
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="text-green-400">{t("liveUpdatesOn")}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-yellow-400">{t("connectingLiveUpdates")}</span>
              </>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-5 mt-6">
        {/* Tabs */}
        {!loading && !error && normalized.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${
                    active
                      ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium"
                      : "border border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {t(tab.labelKey)}
                  <span className={`ml-1.5 ${active ? "text-white/80" : "text-zinc-500"}`}>{counts[tab.key]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Action error */}
        {actionError && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4" role="alert">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm flex-1">{actionError}</p>
            <button
              onClick={() => setActionError(null)}
              aria-label={t("dismiss")}
              className="text-red-400 hover:text-red-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <BookingSkeletons />
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center" role="alert">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button onClick={() => fetchBookings()} className={`${btnGhost} px-5 py-2 text-sm`}>
              {t("tryAgain")}
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-10 text-center flex flex-col items-center">
            <div className="p-4 bg-white/5 rounded-2xl mb-4">
              {normalized.length === 0 ? (
                <Calendar className="w-10 h-10 text-zinc-500" />
              ) : (
                <Headphones className="w-10 h-10 text-zinc-500" />
              )}
            </div>
            <h2 className="text-xl font-bold mb-2">{t(emptyCopy.titleKey)}</h2>
            <p className="text-zinc-400 mb-6">{t(emptyCopy.bodyKey)}</p>
            <Link to="/" className={`${btnPrimary} px-6 py-2.5`}>
              {t("findDJ")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                cancelling={cancellingId === booking.id}
                onCancel={setPendingCancel}
                t={t}
              />
            ))}
          </div>
        )}
      </main>

      {pendingCancel && (
        <CancelDialog
          booking={pendingCancel}
          busy={cancellingId === pendingCancel.id}
          onConfirm={confirmCancel}
          onClose={() => setPendingCancel(null)}
          t={t}
        />
      )}
    </div>
  );
}