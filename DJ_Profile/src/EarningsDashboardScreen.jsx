import { Wallet, TrendingUp, Banknote, ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function EarningsDashboardScreen() {
  // Mock data for the chart
  const data = [
    { name: 'Aug', amount: 3200 },
    { name: 'Sep', amount: 4800 },
    { name: 'Oct', amount: 5600 },
    { name: 'Nov', amount: 4200 },
    { name: 'Dec', amount: 8400 },
    { name: 'Jan', amount: 3500 },
  ];

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      <div className="px-6 pt-4 pb-6 border-b border-zinc-800">
        <h1 className="text-3xl font-bold text-white mb-1">Financials</h1>
        <p className="text-zinc-400">Track your GigZa earnings and payouts</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-6 space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="bg-purple-500/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <Wallet className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-zinc-400 text-sm mb-1">Available Payout</p>
            <h2 className="text-3xl font-bold text-white">R4,800</h2>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="bg-green-500/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-zinc-400 text-sm mb-1">Total Earned (YTD)</p>
            <h2 className="text-3xl font-bold text-white">R29,700</h2>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Revenue History</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#a855f7', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Recent Payouts</h3>
            <button className="text-purple-400 text-sm font-bold flex items-center gap-1 hover:text-purple-300">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {[
              { id: 1, desc: "Withdrawal to Standard Bank", date: "Oct 12, 2026", amount: "-R5,600", type: "out" },
              { id: 2, desc: "Gig: Wedding Reception", date: "Oct 10, 2026", amount: "+R4,000", type: "in" },
              { id: 3, desc: "Gig: Birthday Party", date: "Sep 28, 2026", amount: "+R1,600", type: "in" },
            ].map(tx => (
              <div key={tx.id} className="flex justify-between items-center py-3 border-b border-zinc-800 last:border-0">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${tx.type === 'in' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{tx.desc}</p>
                    <p className="text-zinc-500 text-xs">{tx.date}</p>
                  </div>
                </div>
                <span className={`font-bold ${tx.type === 'in' ? 'text-green-400' : 'text-white'}`}>{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}