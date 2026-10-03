import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar, MapPin, Clock, Banknote, CheckCircle2, XCircle,
  Inbox, Flame, TrendingUp, Undo2, AlertCircle, Sparkles,
  ChevronRight, User, Zap,
} from "lucide-react";

// ---------- helpers ----------
const SEED_REQUESTS = [
  {
    id: "REQ-9921",
    client: "Sarah Ndlovu",
    eventType: "Wedding Reception",
    date: "2026-10-24",
    time: "17:00",
    duration: "5 Hours",
    durationHours: 5,
    location: "Katy's Palace Bar, Kramerville",
    pay: 4000,
    notes: "Need a mix of House and 90s RnB. No techno please.",
    receivedAt: Date.now() - 1000 * 60 * 45, // 45 min ago
  },
  {
    id: "REQ-9922",
    client: "TechCorp SA",
    eventType: "Corporate Event",
    date: "2026-11-05",
    time: "19:00",
    duration: "3 Hours",
    durationHours: 3,
    location: "Sandton Convention Centre",
    pay: 2400,
    notes: "Standard background lounge music during networking.",
    receivedAt: Date.now() - 1000 * 60 * 60 * 6, // 6h ago
  },
];

const DECLINE_REASONS = [
  "Already booked",
  "Too far",
  "Rate too low",
  "Wrong genre",
  "Other",
];

const parseDate = (s) => {
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

const daysUntil = (dateStr) => {
  const d = parseDate(dateStr);
  if (!d) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
};

const timeAgo = (ts) => {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const initials = (name) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const urgency = (req, avgRate) => {
  const days = daysUntil(req.date);
  const hourly = req.pay / (req.durationHours || 1);
  const rateRatio = avgRate ? hourly / avgRate : 1;

  if (days <= 3) return { label: days <= 0 ? "TODAY" : `IN ${days}D`, tone: "hot" };
  if (days <= 7) return { label: `IN ${days}D`, tone: "warm" };
  if (rateRatio >= 1.3) return { label: "HIGH PAY", tone: "gold" };
  return null;
};

const toneMap = {
  hot: "bg-red-500/15 text-red-400 border-red-500/30",
  warm: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  gold: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
};

// ---------- component ----------
export function DJRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all"); // all | urgent | highpay | week
  const [pendingDecline, setPendingDecline] = useState(null); // request id
  const [acceptingId, setAcceptingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [lastDeclined, setLastDeclined] = useState(null);

  // load
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("gigzaRequests"));
    setRequests(stored && stored.length ? stored : SEED_REQUESTS);
  }, []);

  // persist
  useEffect(() => {
    if (requests.length) {
      localStorage.setItem("gigzaRequests", JSON.stringify(requests));
    }
  }, [requests]);

  const avgRate = useMemo(() => {
    if (!requests.length) return 0;
    const rates = requests.map((r) => r.pay / (r.durationHours || 1));
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  }, [requests]);

  const filtered = useMemo(() => {
    const sorted = [...requests].sort((a, b) => {
      const d = daysUntil(a.date) - daysUntil(b.date);
      return d !== 0 ? d : b.pay - a.pay;
    });
    if (filter === "urgent") return sorted.filter((r) => daysUntil(r.date) <= 7);
    if (filter === "highpay") return sorted.filter((r) => r.pay / (r.durationHours || 1) >= avgRate * 1.2);
    if (filter === "week") return sorted.filter((r) => daysUntil(r.date) >= 0 && daysUntil(r.date) <= 7);
    return sorted;
  }, [requests, filter, avgRate]);

  const counts = useMemo(() => ({
    all: requests.length,
    urgent: requests.filter((r) => daysUntil(r.date) <= 7).length,
    highpay: requests.filter((r) => r.pay / (r.durationHours || 1) >= avgRate * 1.2).length,
    week: requests.filter((r) => {
      const d = daysUntil(r.date);
      return d >= 0 && d <= 7;
    }).length,
  }), [requests, avgRate]);

  const showToast = (message, tone = "success", undo = null) => {
    setToast({ message, tone, undo });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAccept = (req) => {
    setAcceptingId(req.id);
    setTimeout(() => {
      // move to bookings
      const bookings = JSON.parse(localStorage.getItem("gigzaBookings")) || [];
      const booking = {
        id: req.id,
        eventType: req.eventType,
        client: req.client,
        date: req.date,
        time: req.time,
        duration: req.duration,
        location: req.location,
        guests: req.guests || null,
        notes: req.notes,
        totalPaid: req.pay,
      };
      localStorage.setItem("gigzaBookings", JSON.stringify([...bookings, booking]));

      setRequests((rs) => rs.filter((r) => r.id !== req.id));
      setAcceptingId(null);
      showToast(`Gig confirmed with ${req.client} 🎉`);
    }, 500);
  };

  const confirmDecline = (reason) => {
    const target = requests.find((r) => r.id === pendingDecline);
    if (!target) return;
    setLastDeclined({ req: target, reason });
    setRequests((rs) => rs.filter((r) => r.id !== pendingDecline));
    setPendingDecline(null);
    showToast(`Declined · ${reason}`, "neutral", () => {
      setRequests((rs) => [target, ...rs]);
      setLastDeclined(null);
      showToast("Request restored");
    });
  };

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      {toast && <Toast {...toast} onUndo={() => { toast.undo?.(); setToast(null); }} />}

      {/* Header */}
      <div className="px-6 pt-4 pb-6 border-b border-zinc-800 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Incoming Requests</h1>
          </div>
          <p className="text-zinc-400">
            {requests.length === 0
              ? "You're all caught up"
              : `${requests.length} pending booking${requests.length === 1 ? "" : "s"} awaiting your response`}
          </p>

          {/* Quick stats */}
          {requests.length > 0 && (
            <div className="flex gap-3 mt-4">
              <StatChip icon={Flame} label={`${counts.urgent} urgent`} tone="hot" />
              <StatChip icon={TrendingUp} label={`${counts.highpay} high pay`} tone="gold" />
              <StatChip icon={Banknote} label={`R${requests.reduce((s, r) => s + r.pay, 0).toLocaleString()} potential`} tone="green" />
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="max-w-3xl mx-auto px-6 mt-4">
        <div className="flex gap-2 p-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-x-auto">
          {[
            { id: "all", label: "All" },
            { id: "urgent", label: "Urgent" },
            { id: "highpay", label: "High Pay" },
            { id: "week", label: "This Week" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 min-w-fit py-2 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                filter === tab.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              {tab.label}
              <span className={`ml-2 text-xs ${filter === tab.id ? "text-purple-200" : "text-zinc-600"}`}>
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="max-w-3xl mx-auto px-6 mt-6 space-y-5">
        {filtered.length === 0 ? (
          <EmptyState filter={filter} onReset={() => setFilter("all")} />
        ) : (
          filtered.map((req, i) => (
            <RequestCard
              key={req.id}
              req={req}
              index={i}
              avgRate={avgRate}
              accepting={acceptingId === req.id}
              onAccept={() => handleAccept(req)}
              onDecline={() => setPendingDecline(req.id)}
            />
          ))
        )}
      </div>

      {/* Decline reason sheet */}
      {pendingDecline && (
        <DeclineSheet
          onCancel={() => setPendingDecline(null)}
          onConfirm={confirmDecline}
        />
      )}
    </div>
  );
}

// ---------- subcomponents ----------
function StatChip({ icon: Icon, label, tone }) {
  const tones = {
    hot: "text-red-400 bg-red-500/10 border-red-500/20",
    gold: "text-yellow-300 bg-yellow-500/10 border-yellow-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
  };
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${tones[tone]}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}

function RequestCard({ req, index, avgRate, accepting, onAccept, onDecline }) {
  const hourly = Math.round(req.pay / (req.durationHours || 1));
  const u = urgency(req, avgRate);
  const days = daysUntil(req.date);

  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:border-purple-500/40 hover:-translate-y-0.5 animate-fade-in ${
        accepting ? "opacity-50 scale-95 pointer-events-none" : ""
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Pay ribbon */}
      <div className="absolute top-0 right-0 bg-gradient-to-bl from-purple-500/15 to-transparent px-4 py-2 rounded-bl-2xl border-b border-l border-purple-500/20">
        <div className="text-right">
          <div className="text-lg font-bold text-white leading-none">R{req.pay.toLocaleString()}</div>
          <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mt-1">
            R{hourly}/hr
          </div>
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-start gap-3 mb-4 max-w-[70%]">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-900/30 border border-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-sm shrink-0">
          {initials(req.client)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-white truncate">{req.eventType}</h3>
            {u && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${toneMap[u.tone]} ${u.tone === "hot" ? "animate-pulse" : ""}`}>
                {u.label}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 truncate">
            by <span className="text-white font-medium">{req.client}</span>
            <span className="text-zinc-600"> · {timeAgo(req.receivedAt)}</span>
          </p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Detail icon={Calendar} text={req.date} />
        <Detail icon={Clock} text={`${req.time} · ${req.duration}`} />
        <Detail icon={MapPin} text={req.location} span={2} />
      </div>

      {/* Notes */}
      <div className="bg-black/50 p-4 rounded-xl border border-zinc-800/50 mb-5 relative">
        <div className="absolute -top-2 left-4 bg-zinc-900 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Client Note
        </div>
        <p className="text-sm text-zinc-400 italic">"{req.notes}"</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onDecline}
          className="flex-1 bg-zinc-800 hover:bg-red-500/15 text-zinc-300 hover:text-red-400 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-zinc-800 hover:border-red-500/30"
        >
          <XCircle className="w-5 h-5" /> Decline
        </button>
        <button
          onClick={onAccept}
          disabled={accepting}
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {accepting ? (
            <>
              <CheckCircle2 className="w-5 h-5 animate-pulse" /> Confirming...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" /> Accept Gig
            </>
          )}
        </button>
      </div>

      {/* Days-until footline for extra urgency */}
      {days >= 0 && days <= 14 && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500">
          <AlertCircle className="w-3 h-3" />
          Event is {days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, text, span = 1 }) {
  return (
    <div className={`flex items-center gap-2.5 text-zinc-300 bg-black/40 p-3 rounded-xl ${span === 2 ? "col-span-2" : ""}`}>
      <Icon className="w-4 h-4 text-purple-400 shrink-0" />
      <span className="text-sm font-medium truncate">{text}</span>
    </div>
  );
}

function DeclineSheet({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div
        className="bg-zinc-900 border-t sm:border border-zinc-800 sm:rounded-3xl rounded-t-3xl w-full sm:max-w-md p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-1">Why decline?</h3>
        <p className="text-sm text-zinc-500 mb-5">This helps clients understand and keeps things professional.</p>
        <div className="space-y-2">
          {DECLINE_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => onConfirm(reason)}
              className="w-full flex items-center justify-between text-left px-4 py-3 rounded-xl bg-black border border-zinc-800 hover:border-red-500/40 hover:bg-red-500/5 text-zinc-300 hover:text-white transition-all group"
            >
              <span className="font-medium">{reason}</span>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-red-400 transition" />
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="w-full mt-4 py-3 rounded-xl text-zinc-400 hover:text-white font-semibold transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EmptyState({ filter, onReset }) {
  const copy = {
    all: { title: "Inbox zero 🎉", sub: "No pending requests. New bookings will land here." },
    urgent: { title: "Nothing urgent", sub: "No gigs coming up in the next 7 days." },
    highpay: { title: "No standout offers", sub: "Nothing paying above your average rate right now." },
    week: { title: "Clear week", sub: "No events scheduled for the next 7 days." },
  }[filter];

  return (
    <div className="text-center py-16 px-6 border border-dashed border-zinc-800 rounded-3xl">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-purple-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{copy.title}</h3>
      <p className="text-sm text-zinc-500 mb-4">{copy.sub}</p>
      {filter !== "all" && (
        <button
          onClick={onReset}
          className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition"
        >
          View all requests
        </button>
      )}
    </div>
  );
}

function Toast({ message, tone, onUndo }) {
  const tones = {
    success: "bg-green-500/10 border-green-500/30 text-green-400",
    neutral: "bg-zinc-800 border-zinc-700 text-zinc-300",
  };
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl ${tones[tone]}`}>
        <span className="text-sm font-semibold">{message}</span>
        {onUndo && (
          <button
            onClick={onUndo}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md transition"
          >
            <Undo2 className="w-3 h-3" /> Undo
          </button>
        )}
      </div>
    </div>
  );
}