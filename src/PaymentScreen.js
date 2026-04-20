import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  Clock,
  MapPin,
  Check,
} from "lucide-react";

const mockBooking = {
  djName: "DJ Pulse",
  djImage: "https://images.unsplash.com/photo-1764510383709-14be6ec28548?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  eventType: "Wedding",
  date: "April 15, 2026",
  time: "7:00 PM - 11:00 PM",
  location: "Grand Hotel, NYC",
  duration: 4,
  hourlyRate: 250,
  subtotal: 1000,
  serviceFee: 100,
  tax: 100,
  total: 1200,
  depositPercentage: 30,
};

const paymentMethods = [
  { id: "card", name: "Credit/Debit Card", icon: CreditCard },
  { id: "paypal", name: "PayPal", icon: CreditCard },
  { id: "apple", name: "Apple Pay", icon: CreditCard },
];

export function PaymentScreen() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const depositAmount = (mockBooking.total * mockBooking.depositPercentage) / 100;

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      navigate("/bookings");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black pb-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/30 to-black px-6 pt-6 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-zinc-900 rounded-full p-2"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Payment</h1>
            <p className="text-sm text-zinc-400">Complete your booking</p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Booking Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Booking Summary
          </h2>
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
            <img
              src={mockBooking.djImage}
              alt={mockBooking.djName}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div>
              <h3 className="font-semibold text-white">{mockBooking.djName}</h3>
              <p className="text-sm text-purple-400">{mockBooking.eventType}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar className="w-4 h-4 text-purple-400" />
              {mockBooking.date}
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock className="w-4 h-4 text-purple-400" />
              {mockBooking.time}
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <MapPin className="w-4 h-4 text-purple-400" />
              {mockBooking.location}
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Payment Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">
                ${mockBooking.hourlyRate}/hr × {mockBooking.duration} hours
              </span>
              <span className="text-white">${mockBooking.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Service Fee</span>
              <span className="text-white">${mockBooking.serviceFee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Tax</span>
              <span className="text-white">${mockBooking.tax}</span>
            </div>
            <div className="border-t border-zinc-800 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-white">Total</span>
                <span className="font-semibold text-white">
                  ${mockBooking.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Info */}
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-zinc-400">
                Deposit Due ({mockBooking.depositPercentage}%)
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                ${depositAmount.toFixed(2)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Remaining ${(mockBooking.total - depositAmount).toFixed(2)} due
                at event
              </p>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Payment Method
          </h2>
          <div className="space-y-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    selectedMethod === method.id
                      ? "bg-purple-500/20 border-purple-500"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-purple-400" />
                    <span className="text-white">{method.name}</span>
                  </div>
                  {selectedMethod === method.id && (
                    <div className="bg-purple-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Details */}
        {selectedMethod === "card" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Card Details
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white font-semibold py-4 rounded-xl shadow-lg shadow-purple-500/30"
        >
          {isProcessing ? (
            <span>Processing...</span>
          ) : (
            <span>Pay ${depositAmount.toFixed(2)}</span>
          )}
        </button>

        <p className="text-xs text-zinc-500 text-center">
          By confirming, you agree to GIGZA's terms and conditions
        </p>
      </div>
    </div>
  );
}