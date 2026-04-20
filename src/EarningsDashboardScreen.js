import { ArrowLeft, DollarSign, TrendingUp, Calendar, Clock } from "lucide-react";
import { Link } from "react-router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const earningsData = [
  { month: "Oct", amount: 2400 },
  { month: "Nov", amount: 3200 },
  { month: "Dec", amount: 2800 },
  { month: "Jan", amount: 4100 },
  { month: "Feb", amount: 3800 },
  { month: "Mar", amount: 5200 },
];

const recentGigs = [
  {
    id: 1,
    event: "Wedding Reception",
    client: "Sarah M.",
    date: "March 28, 2026",
    amount: 1200,
    status: "paid",
  },
  {
    id: 2,
    event: "Birthday Party",
    client: "Mike R.",
    date: "March 22, 2026",
    amount: 800,
    status: "paid",
  },
  {
    id: 3,
    event: "Corporate Event",
    client: "Tech Corp",
    date: "March 15, 2026",
    amount: 1500,
    status: "paid",
  },
  {
    id: 4,
    event: "Club Night",
    client: "Pulse Club",
    date: "March 8, 2026",
    amount: 600,
    status: "pending",
  },
];

export function EarningsDashboardScreen() {
  const totalEarnings = earningsData.reduce((sum, item) => sum + item.amount, 0);
  const thisMonthEarnings = earningsData[earningsData.length - 1].amount;
  const pendingPayments = recentGigs
    .filter((gig) => gig.status === "pending")
    .reduce((sum, gig) => sum + gig.amount, 0);
  const totalGigs = recentGigs.length;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            to="/"
            className="bg-zinc-900 rounded-full p-3 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </Link>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">DJ Dashboard</h1>
            <p className="text-lg text-zinc-400">Track your earnings and performance</p>
          </div>
        </div>

        {/* Total Earnings Card */}
        <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl p-8 lg:p-10 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-purple-100 mb-2">Total Earnings</p>
              <h2 className="text-5xl lg:text-6xl font-bold text-white mb-3">
                ${totalEarnings.toLocaleString()}
              </h2>
              <p className="text-purple-100 mb-4">Last 6 months</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <span className="text-green-300 font-semibold text-lg">+23%</span>
                <span className="text-purple-100">vs last period</span>
              </div>
            </div>
            <div className="bg-white/20 rounded-full p-6 w-max">
              <DollarSign className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>

        {/* Stats Grid & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-6 h-6 text-purple-400" />
                <p className="text-zinc-400">This Month</p>
              </div>
              <p className="text-4xl font-bold text-white">
                ${thisMonthEarnings.toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-blue-400" />
                <p className="text-zinc-400">Pending</p>
              </div>
              <p className="text-4xl font-bold text-white">
                ${pendingPayments.toLocaleString()}
              </p>
            </div>
            <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-purple-500/30 transition-all">
              Withdraw Earnings
            </button>
          </div>

          {/* Earnings Chart */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Earnings Overview
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="month"
                    stroke="#71717a"
                    style={{ fontSize: "14px" }}
                  />
                  <YAxis
                    stroke="#71717a"
                    style={{ fontSize: "14px" }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    formatter={(value) => [`$${value}`, "Earnings"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#a855f7"
                    strokeWidth={4}
                    dot={{ fill: "#a855f7", r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Gigs */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold text-white mb-6">Recent Gigs</h2>
            <div className="space-y-4">
              {recentGigs.map((gig) => (
                <div
                  key={gig.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-purple-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white">{gig.event}</h3>
                      <p className="text-zinc-400 mt-1">{gig.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white text-2xl">
                        ${gig.amount}
                      </p>
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                          gig.status === "paid"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {gig.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Calendar className="w-4 h-4" />
                    <span>{gig.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sticky top-24">
              <h3 className="text-2xl font-semibold text-white mb-6">Performance Summary</h3>
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Total Gigs</span>
                  <span className="text-2xl font-semibold text-white">{totalGigs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Average per Gig</span>
                  <span className="text-2xl font-semibold text-white">
                    ${Math.round(totalEarnings / totalGigs)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Success Rate</span>
                  <span className="text-2xl font-semibold text-green-400">98%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}