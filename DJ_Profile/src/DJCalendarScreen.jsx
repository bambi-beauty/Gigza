import { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, Clock, Users, FileText, Sparkles, TrendingUp, ExternalLink } from "lucide-react";

// --- helpers ---
const parseGigDate = (dateStr) => {
  const d = new Date(dateStr);
  return isNaN(d) ? null : d;
};

const getRelativeDays = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

const getCountdownLabel = (date) => {
  const days = getRelativeDays(date);
  if (days === 0) return { text: "TODAY", tone: "hot" };
  if (days === 1) return { text: "TOMORROW", tone: "hot" };
  if (days > 1 && days <= 7) return { text: `IN ${days} DAYS`, tone: "warm" };
  if (days > 7) return { text: `IN ${days} DAYS`, tone: "cool" };
  if (days === -1) return { text: "YESTERDAY", tone: "past" };
  return { text: `${Math.abs(days)} DAYS AGO`, tone: "past" };
};

const toneStyles = {
  hot: "bg-red-500/15 text-red-400 border-red-500/30 animate-pulse",
  warm: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  cool: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  past: "bg-zinc-800 text-zinc-500 border-zinc-700",
};

const buildGoogleCalendarUrl = (gig) => {
  const date = parseGigDate(gig.date);
  if (!date) return null;
  // naive: assume gig.time like "20:00" — adjust to your data shape
  const [h = "20", m = "00"] = (gig.time || "20:00").split(":");
  const start = new Date(date);
  start.setHours(parseInt(h), parseInt(m), 0, 0);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // default 3h
  const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `DJ Gig — ${gig.eventType || "Performance"}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: gig.notes || "",
    location: gig.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export function DJCalendarScreen() {
  const [myGigs, setMyGigs] = useState([]);
  const [filter, setFilter] = useState("upcoming"); // upcoming | past | all

  useEffect(() => {
    const allBookings = JSON.parse(localStorage.getItem("gigzaBookings")) || [];
    setMyGigs(allBookings);
  }, []);

  // enrich + split
  const { upcoming, past, visible, totalEarnings, upcomingEarnings } = useMemo(() => {
    const enriched = myGigs.map((g) => {
      const date = parseGigDate(g.date);
      const days = date ? getRelativeDays(date) : 999;
      return { ...g, _date: date, _days: days, _isPast: days < 0 };
    });

    const upcoming = enriched
      .filter((g) => !g._isPast)
      .sort((a, b) => a._days - b._days);

    const past = enriched
      .filter((g) => g._isPast)
      .sort((a, b) => b._days - a._days);

    const visible = filter === "upcoming" ? upcoming : filter === "past" ? past : [...upcoming, ...past];

    const totalEarnings = enriched.reduce((sum, g) => sum + (Number(g.totalPaid) || 0), 0);
    const upcomingEarnings = upcoming.reduce((sum, g) => sum + (Number(g.totalPaid) || 0), 0);

    return { upcoming, past, visible, totalEarnings, upcomingEarnings };
  }, [myGigs, filter]);

  const tabs = [
    { id: "upcoming", label: "Upcoming", count: upcoming.length },
    { id: "past", label: "Past", count: past.length },
    { id: "all", label: "All", count: myGigs.length },
  ];

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/40 to-black px-6 pt-4 pb-6 border-b border-zinc-800">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">My Gigs</h1>
          </div>
          <p className="text-zinc-400">Your upcoming scheduled performances</p>

          {/* Earnings strip */}
          {myGigs.length > 0 && (
            <div className="mt-4 flex items-center gap-3 bg-black/40 border border-zinc-800 rounded-2xl px-4 py-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Upcoming Earnings</p>
                <p className="text-lg font-bold text-white">
                  R{upcomingEarnings.toLocaleString()}
                  <span className="text-sm text-zinc-500 font-medium ml-2">
                    / R{totalEarnings.toLocaleString()} all-time
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="max-w-3xl mx-auto px-6 mt-4">
        <div className="flex gap-2 p-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                filter === tab.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              {tab.label}
              <span className={`ml-2 text-xs ${filter === tab.id ? "text-purple-200" : "text-zinc-600"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Gig list */}
      <div className="max-w-3xl mx-auto px-6 mt-6 space-y-6">
        {visible.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          visible.map((gig, idx) => (
            <GigCard key={gig.id} gig={gig} index={idx} />
          ))
        )}
      </div>
    </div>
  );
}

function GigCard({ gig, index }) {
  const countdown = gig._date ? getCountdownLabel(gig.date) : null;
  const gcalUrl = buildGoogleCalendarUrl(gig);

  return (
    <div
      className={`group bg-zinc-900 border rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/20 animate-fade-in ${
        gig._isPast
          ? "border-zinc-800/60 opacity-60 hover:opacity-90"
          : "border-zinc-800 hover:border-purple-500/40"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top row */}
      <div className="flex justify-between items-start border-b border-zinc-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">
              {gig.eventType}
            </span>
            {countdown && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${toneStyles[countdown.tone]}`}
              >
                {countdown.text}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-white">{gig.location}</h3>
        </div>
        <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-lg text-sm font-bold border border-green-500/20 whitespace-nowrap">
          R{gig.totalPaid}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <InfoTile icon={Calendar} text={gig.date} />
        <InfoTile icon={Clock} text={`${gig.time} (${gig.duration})`} />
        <InfoTile icon={MapPin} text={gig.location} />
        <InfoTile icon={Users} text={`${gig.guests || "N/A"} Guests`} />
      </div>

      {/* Notes */}
      {gig.notes && (
        <div className="bg-black/40 p-4 rounded-xl border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-zinc-300">Client Notes</span>
          </div>
          <p className="text-sm text-zinc-400 italic">"{gig.notes}"</p>
        </div>
      )}

      {/* Footer actions */}
      {!gig._isPast && gcalUrl && (
        <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-2 rounded-xl transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Add to Google Calendar
          </a>
        </div>
      )}
    </div>
  );
}

function InfoTile({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-zinc-300 bg-black/40 p-3 rounded-xl">
      <Icon className="w-5 h-5 text-zinc-500 shrink-0" />
      <span className="text-sm font-medium truncate">{text}</span>
    </div>
  );
}

function EmptyState({ filter }) {
  const copy = {
    upcoming: { title: "No upcoming gigs", sub: "Bookings you accept will appear here." },
    past: { title: "No past gigs yet", sub: "Your completed performances will show up here." },
    all: { title: "No gigs yet", sub: "Once you book your first performance, it'll show here." },
  }[filter];

  return (
    <div className="text-center py-16 px-6 border border-dashed border-zinc-800 rounded-3xl">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
        <Calendar className="w-8 h-8 text-purple-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{copy.title}</h3>
      <p className="text-sm text-zinc-500">{copy.sub}</p>
    </div>
  );
}