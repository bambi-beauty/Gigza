import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Banknote, TrendingUp, Calendar, ArrowUpRight, Wallet, Clock } from 'lucide-react';

// 1. Our Mock Financial Data
const monthlyData = [
  { month: 'Jan', earnings: 450 },
  { month: 'Feb', earnings: 800 },
  { month: 'Mar', earnings: 650 },
  { month: 'Apr', earnings: 1100 },
  { month: 'May', earnings: 1400 },
  { month: 'Jun', earnings: 2100 },
];

const recentTransactions = [
  { id: 1, event: "Sarah's Wedding", date: "June 15", amount: 800, status: "Paid" },
  { id: 2, event: "Corporate Tech Gala", date: "June 22", amount: 650, status: "Pending" },
  { id: 3, event: "Club Vertex Set", date: "July 01", amount: 400, status: "Upcoming" },
];

export function EarningsDashboardScreen() {
  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/40 to-black px-6 pt-8 pb-6 border-b border-zinc-800">
        <h1 className="text-3xl font-bold text-white mb-1">Earnings</h1>
        <p className="text-zinc-400">Track your revenue and upcoming payouts</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 space-y-6">
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-3xl p-5">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Banknote className="w-5 h-5" />
              <span className="font-semibold text-sm">Total Earned</span>
            </div>
            <h2 className="text-3xl font-bold text-white">R6,500</h2>
            <div className="flex items-center gap-1 text-green-400 text-xs mt-2">
              <TrendingUp className="w-3 h-3" /> +12% from last month
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Wallet className="w-5 h-5" />
              <span className="font-semibold text-sm">Next Payout</span>
            </div>
            <h2 className="text-3xl font-bold text-white">R1,450</h2>
            <div className="flex items-center gap-1 text-zinc-500 text-xs mt-2">
              <Calendar className="w-3 h-3" /> Expected June 28
            </div>
          </div>
        </div>

        {/* The Interactive Chart! */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Revenue Overview</h3>
            <select className="bg-black border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1 outline-none focus:border-purple-500">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          
          <div className="h-64 w-full">
            {/* ResponsiveContainer makes sure the chart shrinks and grows with the phone screen */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R${value}`} />
                <Tooltip 
                  cursor={{fill: '#27272a', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="earnings" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
            <button className="text-purple-400 text-sm font-medium hover:text-purple-300">View All</button>
          </div>
          
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    tx.status === 'Paid' ? 'bg-green-500/20 text-green-400' : 
                    tx.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {tx.status === 'Paid' ? <Banknote className="w-5 h-5" /> : 
                     tx.status === 'Pending' ? <Clock className="w-5 h-5" /> : 
                     <Calendar className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{tx.event}</h4>
                    <p className="text-zinc-500 text-xs">{tx.date} • {tx.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">R{tx.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}