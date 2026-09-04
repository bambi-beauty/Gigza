import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Banknote, TrendingUp, Calendar, Wallet, Clock, Loader2, AlertCircle } from 'lucide-react';
import { getUserBookings } from './services/bookingService';

const STATUS_LABEL = {
  completed: 'Paid',
  confirmed: 'Upcoming',
  pending: 'Pending',
  cancelled: 'Cancelled'
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function EarningsDashboardScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserBookings();
      setBookings(data.success && data.bookings ? data.bookings : []);
    } catch (err) {
      console.error('Error fetching earnings data:', err);
      setError(err.message || 'Failed to load earnings data');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const totalEarned = useMemo(() => (
    bookings
      .filter((b) => b.booking_status === 'completed')
      .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0)
  ), [bookings]);

  const nextPayout = useMemo(() => (
    bookings
      .filter((b) => b.booking_status === 'confirmed')
      .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0)
  ), [bookings]);

  const monthlyData = useMemo(() => {
    const totals = MONTH_LABELS.map((month) => ({ month, earnings: 0 }));
    bookings
      .filter((b) => b.booking_status === 'completed' && b.event_date)
      .forEach((b) => {
        const monthIndex = new Date(b.event_date).getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          totals[monthIndex].earnings += Number(b.total_price) || 0;
        }
      });
    return totals;
  }, [bookings]);

  const recentTransactions = useMemo(() => (
    [...bookings]
      .filter((b) => b.booking_status !== 'pending')
      .sort((a, b) => new Date(b.event_date || 0) - new Date(a.event_date || 0))
      .slice(0, 5)
  ), [bookings]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-zinc-400">Loading your earnings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/40 to-black px-6 pt-8 pb-6 border-b border-zinc-800">
        <h1 className="text-3xl font-bold text-white mb-1">Earnings</h1>
        <p className="text-zinc-400">Track your revenue and upcoming payouts</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 space-y-6">

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button onClick={fetchBookings} className="text-red-400 text-sm hover:text-red-300 transition">
              Retry
            </button>
          </div>
        )}

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-3xl p-5">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Banknote className="w-5 h-5" />
              <span className="font-semibold text-sm">Total Earned</span>
            </div>
            <h2 className="text-3xl font-bold text-white">R{totalEarned.toLocaleString()}</h2>
            <div className="flex items-center gap-1 text-zinc-500 text-xs mt-2">
              <TrendingUp className="w-3 h-3" /> From completed gigs
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Wallet className="w-5 h-5" />
              <span className="font-semibold text-sm">Upcoming Payout</span>
            </div>
            <h2 className="text-3xl font-bold text-white">R{nextPayout.toLocaleString()}</h2>
            <div className="flex items-center gap-1 text-zinc-500 text-xs mt-2">
              <Calendar className="w-3 h-3" /> From confirmed gigs
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Revenue Overview</h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R${value}`} />
                <Tooltip
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="earnings" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>

          {recentTransactions.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center">
              <p className="text-zinc-400">No transactions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.booking_id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      tx.booking_status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      tx.booking_status === 'confirmed' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {tx.booking_status === 'completed' ? <Banknote className="w-5 h-5" /> :
                       tx.booking_status === 'confirmed' ? <Clock className="w-5 h-5" /> :
                       <Calendar className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{tx.event_type || 'Event'}</h4>
                      <p className="text-zinc-500 text-xs">{formatDate(tx.event_date)} • {STATUS_LABEL[tx.booking_status] || tx.booking_status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold">R{tx.total_price || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
