// BookingFormScreen.js
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { CalendarIcon, Clock, Users, MapPin, Music, ArrowLeft, Loader2 } from "lucide-react";
import { useUser } from "./UserContext/ThisUserContext";
import { useSocket } from "./UserContext/SocketContext";
import { createBooking, checkDJAvailability } from "./services/bookingService";

export function BookingFormScreen() {
  const { djId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getToken } = useUser();
  const { socket, isConnected, setNotifications, setUnreadCount } = useSocket();
  
  // ✅ Get pre-filled data from navigation state (from DJ Profile)
  const prefillData = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [djInfo, setDjInfo] = useState(prefillData.dj || null);
  
  const [formData, setFormData] = useState({
    event_date: prefillData.date || "",
    event_time: prefillData.time || "",
    duration_hours: prefillData.duration || 4,
    number_of_guests: 0,
    event_type: "",
    event_location: "",
    price_per_hour: prefillData.pricePerHour || 0,
    total_price: prefillData.totalPrice || 0
  });

  // ✅ Listen for real-time notifications from server
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('🔌 Socket not connected, notifications will not be real-time');
      return;
    }

    console.log('👂 Setting up booking notification listeners...');

    // Handle general booking notifications
    const handleBookingNotification = (data) => {
      console.log('📬 Booking notification received:', data);
      setNotifications(prev => [{
        id: Date.now(),
        title: data.title || 'Booking Update',
        message: data.message || 'Your booking has been updated',
        type: data.type || 'booking',
        data: data.data || {},
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Handle booking created
    const handleBookingCreated = (data) => {
      console.log('📬 Booking created notification received:', data);
      setNotifications(prev => [{
        id: Date.now(),
        title: 'Booking Created! 🎉',
        message: data.message || 'Your booking has been created and is pending confirmation.',
        type: 'booking_created',
        data: data,
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Handle booking confirmed
    const handleBookingConfirmed = (data) => {
      console.log('📬 Booking confirmed notification received:', data);
      setNotifications(prev => [{
        id: Date.now(),
        title: 'Booking Confirmed! ✅',
        message: data.message || 'Your booking has been confirmed!',
        type: 'booking_confirmed',
        data: data,
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Handle booking cancelled
    const handleBookingCancelled = (data) => {
      console.log('📬 Booking cancelled notification received:', data);
      setNotifications(prev => [{
        id: Date.now(),
        title: 'Booking Cancelled ❌',
        message: data.message || 'Your booking has been cancelled.',
        type: 'booking_cancelled',
        data: data,
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Handle booking completed
    const handleBookingCompleted = (data) => {
      console.log('📬 Booking completed notification received:', data);
      setNotifications(prev => [{
        id: Date.now(),
        title: 'Booking Completed! ⭐',
        message: data.message || 'Your booking is complete! Please leave a review.',
        type: 'booking_completed',
        data: data,
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Register event listeners
    socket.on('booking_notification', handleBookingNotification);
    socket.on('booking:created', handleBookingCreated);
    socket.on('booking:confirmed', handleBookingConfirmed);
    socket.on('booking:cancelled', handleBookingCancelled);
    socket.on('booking:completed', handleBookingCompleted);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up booking notification listeners');
      socket.off('booking_notification', handleBookingNotification);
      socket.off('booking:created', handleBookingCreated);
      socket.off('booking:confirmed', handleBookingConfirmed);
      socket.off('booking:cancelled', handleBookingCancelled);
      socket.off('booking:completed', handleBookingCompleted);
    };
  }, [socket, isConnected, setNotifications, setUnreadCount]);

  // If no DJ info from state, fetch it
  useEffect(() => {
    if (!djInfo && djId) {
      const fetchDJ = async () => {
        try {
          const { getDJById } = await import('./services/djService');
          const data = await getDJById(djId);
          if (data.success && data.dj) {
            setDjInfo(data.dj);
            setFormData(prev => ({
              ...prev,
              price_per_hour: data.dj.price || data.dj.price_per_hour || 150,
              total_price: (data.dj.price || data.dj.price_per_hour || 150) * prev.duration_hours
            }));
          }
        } catch (error) {
          console.error("Error fetching DJ:", error);
        }
      };
      fetchDJ();
    }
  }, [djId, djInfo]);

  const handleDateTimeChange = async (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Update total price when duration changes
    if (field === 'duration_hours') {
      const pricePerHour = formData.price_per_hour || djInfo?.price || djInfo?.price_per_hour || 150;
      setFormData(prev => ({
        ...prev,
        total_price: pricePerHour * value
      }));
    }
    
    // Check availability when date and time are set
    if (newFormData.event_date && newFormData.event_time) {
      setCheckingAvailability(true);
      try {
        const result = await checkDJAvailability(djId, newFormData.event_date, newFormData.event_time);
        setIsAvailable(result.available);
      } catch (error) {
        console.error("Availability check error:", error);
        setIsAvailable(false);
      } finally {
        setCheckingAvailability(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Calculate total price if not set
      const pricePerHour = formData.price_per_hour || djInfo?.price || djInfo?.price_per_hour || 150;
      const totalPrice = formData.total_price || (pricePerHour * formData.duration_hours);
      
      const bookingData = {
        dj_id: parseInt(djId),
        event_date: formData.event_date,
        event_time: formData.event_time,
        duration_hours: formData.duration_hours,
        number_of_guests: formData.number_of_guests || 0,
        event_type: formData.event_type || null,
        event_location: formData.event_location || null,
        price_per_hour: pricePerHour,
        total_price: totalPrice
      };
      
      console.log("📤 Submitting booking:", bookingData);
      
      const result = await createBooking(bookingData);
      
      if (result.success) {
        // Show success message
        alert('Booking created successfully! Waiting for DJ confirmation.');
        
        navigate("/bookings", { 
          state: { 
            message: "Booking created successfully! Waiting for DJ confirmation." 
          } 
        });
      } else {
        alert(result.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert(error.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white mb-2">Book Your DJ</h1>
          {djInfo && (
            <p className="text-purple-400 text-sm mb-4">
              Booking: {djInfo.dj_name || djInfo.name || `DJ #${djId}`}
              {djInfo.price && <span className="text-zinc-400 ml-2">· R{djInfo.price}/hr</span>}
            </p>
          )}
          
          {/* Socket connection status */}
          <div className="mb-4 text-xs">
            {isConnected ? (
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Real-time notifications active
              </span>
            ) : (
              <span className="text-yellow-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                Connecting to notifications...
              </span>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Event Date *</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => handleDateTimeChange("event_date", e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            
            {/* Time */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Event Time *</label>
              <input
                type="time"
                value={formData.event_time}
                onChange={(e) => handleDateTimeChange("event_time", e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              />
              {checkingAvailability && <p className="text-yellow-400 text-xs mt-1">Checking availability...</p>}
              {isAvailable === true && <p className="text-green-400 text-xs mt-1">✓ DJ is available at this time!</p>}
              {isAvailable === false && <p className="text-red-400 text-xs mt-1">✗ DJ is already booked at this time</p>}
            </div>
            
            {/* Duration */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Duration (hours) *</label>
              <select
                value={formData.duration_hours}
                onChange={(e) => handleDateTimeChange("duration_hours", parseInt(e.target.value))}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                {[2, 3, 4, 5, 6, 8].map(h => <option key={h} value={h}>{h} hours</option>)}
              </select>
            </div>
            
            {/* Guests */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Number of Guests</label>
              <input
                type="number"
                value={formData.number_of_guests}
                onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            {/* Event Type */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Event Type</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Select event type</option>
                <option value="Wedding">Wedding</option>
                <option value="Birthday Party">Birthday Party</option>
                <option value="Corporate Event">Corporate Event</option>
                <option value="Club Night">Club Night</option>
                <option value="Private Party">Private Party</option>
                <option value="Festival">Festival</option>
              </select>
            </div>
            
            {/* Location */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Event Location</label>
              <input
                type="text"
                value={formData.event_location}
                onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                placeholder="Address or venue name"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Price Summary */}
            <div className="bg-black/50 border border-zinc-800 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400">Price per hour</span>
                <span className="text-white">R{formData.price_per_hour || djInfo?.price || djInfo?.price_per_hour || 150}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400">Duration</span>
                <span className="text-white">{formData.duration_hours} hours</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-zinc-800 pt-2 mt-2">
                <span className="text-white">Total</span>
                <span className="text-purple-400">
                  R{formData.total_price || (formData.price_per_hour || djInfo?.price || djInfo?.price_per_hour || 150) * formData.duration_hours}
                </span>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || isAvailable === false || !formData.event_date || !formData.event_time}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirm Booking"}
            </button>
            
            {isAvailable === false && (
              <p className="text-red-400 text-sm text-center">This time slot is not available. Please choose a different time.</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}