import { Calendar, DollarSign, Zap, Bell, Check } from "lucide-react";

const mockNotifications = [
  {
    id: 1,
    type: "booking",
    icon: Calendar,
    title: "Booking Confirmed",
    message: "Your booking with DJ Pulse for April 15 has been confirmed.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    type: "payment",
    icon: DollarSign,
    title: "Payment Received",
    message: "Deposit of $360 received for your upcoming event.",
    time: "5 hours ago",
    read: false,
  },
  {
    id: 3,
    type: "emergency",
    icon: Zap,
    title: "Emergency Request Response",
    message: "Luna Beats accepted your emergency DJ request for tonight!",
    time: "1 day ago",
    read: true,
  },
  {
    id: 4,
    type: "booking",
    icon: Calendar,
    title: "Booking Reminder",
    message: "Your event with Max Voltage is happening tomorrow at 6:00 PM.",
    time: "1 day ago",
    read: true,
  },
  {
    id: 5,
    type: "payment",
    icon: DollarSign,
    title: "Payment Due",
    message: "Remaining balance of $840 due for your event on March 28.",
    time: "2 days ago",
    read: true,
  },
  {
    id: 6,
    type: "general",
    icon: Bell,
    title: "New DJ in Your Area",
    message: "Echo Storm just joined GIGZA and is available in NYC.",
    time: "3 days ago",
    read: true,
  },
  {
    id: 7,
    type: "booking",
    icon: Calendar,
    title: "Booking Completed",
    message: "Your event with Max Voltage was marked as completed. Leave a review!",
    time: "1 week ago",
    read: true,
  },
];

export function NotificationsScreen() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const getIconColor = (type) => {
    switch (type) {
      case "booking":
        return "bg-purple-500/20 text-purple-400";
      case "payment":
        return "bg-green-500/20 text-green-400";
      case "emergency":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-blue-500/20 text-blue-400";
    }
  };

  return (
    <div className="min-h-screen bg-black pb-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/30 to-black px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <div className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {unreadCount} new
            </div>
          )}
        </div>
        <p className="text-sm text-zinc-400">Stay updated with your bookings</p>
      </div>

      {/* Mark All as Read */}
      {unreadCount > 0 && (
        <div className="px-6 mt-4">
          <button className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300">
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="px-6 mt-6 space-y-3">
        {mockNotifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <div
              key={notification.id}
              className={`bg-zinc-900 border rounded-2xl p-4 transition-colors ${
                notification.read
                  ? "border-zinc-800"
                  : "border-purple-500/50 bg-purple-500/5"
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${getIconColor(
                    notification.type
                  )}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-zinc-600 mt-2">
                    {notification.time}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State (hidden when there are notifications) */}
      {mockNotifications.length === 0 && (
        <div className="px-6 mt-20 text-center">
          <div className="bg-zinc-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-10 h-10 text-zinc-700" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No notifications yet
          </h3>
          <p className="text-sm text-zinc-500">
            We'll notify you when something important happens
          </p>
        </div>
      )}
    </div>
  );
}