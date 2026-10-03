import { useState, useEffect, useMemo, useRef } from "react";
import {
  Wallet, TrendingUp, Banknote, ArrowRight, ArrowUpRight, ArrowDownRight,
  Target, Zap, ChevronDown, CheckCircle2, Filter, Calendar,
  CreditCard, Sparkles, Info, Download,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// ---------- helpers ----------
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const formatZAR = (v) => `R${Number(v).toLocaleString("en-ZA")}`;
const formatShortZAR = (v) => {
  if (v >= 1000000) return `R${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R${Math.round(v / 1000)}k`;
  return `R${v}`;
};

// build monthly buckets from gigzaBookings if present, else seed demo
const buildChartData = (range, bookings) => {
  const now = new Date();
  const months = range === "6M" ? 6 : range === "1Y" ? 12 : 18;
  const buckets = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      name: MONTH_LABELS[d.getMonth()],
      fullLabel: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
      amount: 0,
    });
  }

  if (bookings?.length) {
    bookings.forEach((b) => {
      const d = new Date(b.date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find((x) => x.key === key);
      if (bucket) bucket.amount += Number(b.totalPaid) || 0;
    });
  } else {
    // demo fallback
    const demo = [3200, 4800, 5600, 4200, 8400, 3500, 6200, 7100, 5400, 8900, 9800, 7400];
    buckets.forEach((b, i) => (b.amount = demo[demo.length - buckets.length + i] ?? 0));
  }

  return buckets;
};

// count-up animation hook
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;
    let raf;
    const step = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

// ---------- main ----------
export function EarningsDashboardScreen() {
  const [range, setRange] = useState("6M"); // 6M | 1Y | All
  const [bookings, setBookings] = useState([]);
  const [txFilter, setTxFilter] = useState("all"); // all | in | out
  const [chartMetric, setChartMetric] = useState("amount"); // amount | gigs

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("gigzaBookings")) || [];
    setBookings(saved);
  }, []);

  const chartData = useMemo(() => buildChartData(range, bookings), [range, bookings]);

  const stats = useMemo(() => {
    const amounts = chartData.map((d) => d.amount);
    const total = amounts.reduce((a, b) => a + b, 0);
    const thisMonth = amounts[amounts.length - 1] || 0;
    const lastMonth = amounts[amounts.length - 2] || 0;
    const delta = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
    const best = Math.max(...amounts, 0);
    const bestMonth = chartData[amounts.indexOf(best)]?.fullLabel || "—";
    const avg = amounts.length ? Math.round(total / amounts.length) : 0;

    return { total, thisMonth, lastMonth, delta, best, bestMonth, avg };
  }, [chartData]);

  const available = 4800;
  const annualGoal = 50000;
  const ytd = stats.total;
  const goalPct = Math.min(100, Math.round((ytd / annualGoal) * 100));

  const transactions = useMemo(() => {
    const base = [
      { id: 1, desc: "Withdrawal to Standard Bank", date: "Oct 12, 2026", amount: -5600, type: "out", method: "Standard Bank ····4821" },
      { id: 2, desc: "Gig: Wedding Reception", date: "Oct 10, 2026", amount: 4000, type: "in", method: "Sarah Ndlovu" },
      { id: 3, desc: "Gig: Birthday Party", date: "Sep 28, 2026", amount: 1600, type: "in", method: "Thabo M." },
      { id: 4, desc: "Withdrawal to Standard Bank", date: "Sep 15, 2026", amount: -3000, type: "out", method: "Standard Bank ····4821" },
      { id: 5, desc: "Gig: Corporate Event", date: "Sep 05, 2026", amount: 2400, type: "in", method: "TechCorp SA" },
    ];
    if (txFilter === "in") return base.filter((t) => t.type === "in");
    if (txFilter === "out") return base.filter((t) => t.type === "out");
    return base;
  }, [txFilter]);

  // group by month
  const groupedTx = useMemo(() => {
    const groups = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
      if (!groups[key]) groups[key] = { items: [], total: 0 };
      groups[key].items.push(t);
      groups[key].total += t.amount;
    });
    return groups;
  }, [transactions]);

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      {/* Header */}
      <div className="px-6 pt-4 pb-6 border-b border-zinc-800 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-6 h-6 text-purple-400" />
                <h1 className="text-3xl font-bold text-white">Financials</h1>
              </div>
              <p className="text-zinc-400">Track your GigZa earnings and payouts</p>
            </div>
            <button className="hidden sm:flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl font-semibold transition text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-6 space-y-6">
        {/* Hero: Available + Withdraw */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 via-purple-950/20 to-zinc-900 border border-purple-500/20 rounded-3xl p-6">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Available Payout</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  <Zap className="w-3 h-3" /> Instant
                </span>
              </div>
              <h2 className="text-4xl font-bold text-white">
                {formatZAR(useCountUp(available))}
              </h2>
              <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Standard Bank ····4821</span>
                <button className="text-purple-400 hover:text-purple-300 font-semibold">Change</button>
              </div>
            </div>

            <div className="flex flex-col justify-end gap-2 sm:items-end">
              <button className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3.5 rounded-2xl font-bold transition shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50">
                <Banknote className="w-5 h-5" /> Withdraw Funds
              </button>
              <p className="text-[11px] text-zinc-500 text-center sm:text-right">
                Typically arrives in under 30 min
              </p>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={TrendingUp}
            tone="green"
            label="This Month"
            value={formatZAR(useCountUp(stats.thisMonth))}
            delta={stats.delta}
          />
          <KpiCard
            icon={Target}
            tone="purple"
            label={`${range} Total`}
            value={formatZAR(useCountUp(stats.total))}
            sub={`Avg ${formatShortZAR(stats.avg)}/mo`}
          />
          <KpiCard
            icon={Sparkles}
            tone="gold"
            label="Best Month"
            value={formatShortZAR(stats.best)}
            sub={stats.bestMonth}
          />
          <KpiCard
            icon={Calendar}
            tone="blue"
            label="Gigs Played"
            value={bookings.length || 12}
            sub={bookings.length ? "From your bookings" : "Demo data"}
          />
        </div>

        {/* Goal progress */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Annual Goal</h3>
            </div>
            <span className="text-sm font-bold text-white">
              {goalPct}% <span className="text-zinc-500 font-normal">of {formatZAR(annualGoal)}</span>
            </span>
          </div>
          <div className="relative h-3 bg-black rounded-full overflow-hidden border border-zinc-800">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000"
              style={{ width: `${goalPct}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            {goalPct >= 100
              ? "🎉 Goal smashed — time to raise it?"
              : `${formatZAR(annualGoal - ytd)} to go — you're on track at this pace`}
          </p>
        </div>

        {/* Chart card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Revenue History</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {stats.delta >= 0 ? "Trending up" : "Trending down"} vs last month
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex p-1 bg-black border border-zinc-800 rounded-xl">
                {["6M", "1Y", "All"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      range === r
                        ? "bg-purple-500 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatShortZAR}
                />
                <ReferenceLine
                  y={stats.avg}
                  stroke="#a855f7"
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                  label={{ value: "avg", fill: "#a855f7", fontSize: 10, position: "right" }}
                />
                <Tooltip
                  cursor={{ stroke: "#a855f7", strokeWidth: 1, strokeOpacity: 0.3 }}
                  content={<CustomTooltip avg={stats.avg} />}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#a855f7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h3 className="text-lg font-bold text-white">Activity</h3>
            <div className="flex gap-1 p-1 bg-black border border-zinc-800 rounded-xl">
              {[
                { id: "all", label: "All" },
                { id: "in", label: "Earnings" },
                { id: "out", label: "Payouts" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTxFilter(f.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    txFilter === f.id ? "bg-purple-500 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {Object.keys(groupedTx).length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Info className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-zinc-400 text-sm">No transactions in this view</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTx).map(([month, group]) => (
                <div key={month}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{month}</span>
                    <span className={`text-xs font-bold ${group.total >= 0 ? "text-green-400" : "text-zinc-400"}`}>
                      {group.total >= 0 ? "+" : ""}{formatZAR(group.total)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {group.items.map((tx) => (
                      <TransactionRow key={tx.id} tx={tx} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="w-full mt-6 flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 font-bold py-3 rounded-xl hover:bg-purple-500/5 transition">
            View All Transactions <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- subcomponents ----------
function KpiCard({ icon: Icon, tone, label, value, delta, sub }) {
  const tones = {
    green: "bg-green-500/15 text-green-400",
    purple: "bg-purple-500/15 text-purple-400",
    gold: "bg-yellow-500/15 text-yellow-300",
    blue: "bg-blue-500/15 text-blue-400",
  };
  const deltaTone = delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-zinc-500";
  const DeltaIcon = delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 transition-colors hover:border-zinc-700">
      <div className={`${tones[tone]} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-1">{label}</p>
      <h3 className="text-xl font-bold text-white leading-tight">{value}</h3>
      {delta !== undefined && Number.isFinite(delta) && (
        <div className={`flex items-center gap-0.5 mt-1.5 text-xs font-bold ${deltaTone}`}>
          <DeltaIcon className="w-3.5 h-3.5" />
          {Math.abs(delta).toFixed(0)}% vs last month
        </div>
      )}
      {sub && !delta && (
        <p className="text-xs text-zinc-500 mt-1.5">{sub}</p>
      )}
    </div>
  );
}

function TransactionRow({ tx }) {
  const isIn = tx.type === "in";
  return (
    <div className="flex justify-between items-center py-3 px-3 rounded-xl hover:bg-black/40 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2 rounded-lg shrink-0 ${isIn ? "bg-green-500/15 text-green-400" : "bg-zinc-800 text-zinc-400"}`}>
          {isIn ? <Banknote className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-white font-medium text-sm truncate">{tx.desc}</p>
          <p className="text-zinc-500 text-xs truncate">
            {tx.date}{tx.method && ` · ${tx.method}`}
          </p>
        </div>
      </div>
      <span className={`font-bold text-sm whitespace-nowrap ml-3 ${isIn ? "text-green-400" : "text-zinc-300"}`}>
        {isIn ? "+" : ""}{formatZAR(tx.amount)}
      </span>
    </div>
  );
}

function CustomTooltip({ active, payload, avg }) {
  if (!active || !payload?.length) return null;
  const { amount, fullLabel } = payload[0].payload;
  const diff = amount - avg;
  const pct = avg ? Math.round((diff / avg) * 100) : 0;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">{fullLabel}</p>
      <p className="text-white font-bold text-lg leading-none mb-2">{formatZAR(amount)}</p>
      <p className={`text-xs font-bold ${pct >= 0 ? "text-green-400" : "text-red-400"}`}>
        {pct >= 0 ? "▲" : "▼"} {Math.abs(pct)}% vs avg
      </p>
    </div>
  );
}