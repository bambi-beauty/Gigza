// BookingFormScreen.js
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarIcon, Clock, Users, MapPin, Music, ArrowLeft, Loader2 } from "lucide-react";
import { useUser } from "./UserContext/ThisUserContext";
import { createBooking, checkDJAvailability } from "./services/bookingService";

export function BookingFormScreen() {
  const { djId } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useUser();
  
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [formData, setFormData] = useState({
    event_date: "",
    event_time: "",
    duration_hours: 4,
    number_of_guests: 0,
    event_type: "",
    event_location: "",
    price_per_hour: 0,
    total_price: 0
  });

  const handleDateTimeChange = async (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
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
      const bookingData = {
        dj_id: parseInt(djId),
        ...formData
      };
      
      const result = await createBooking(bookingData);
      
      if (result.success) {
        navigate("/bookings", { state: { message: "Booking created successfully!" } });
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
          <h1 className="text-2xl font-bold text-white mb-6">Book Your DJ</h1>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Event Date *</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => handleDateTimeChange("event_date", e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white"
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
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white"
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
                onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white"
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
                onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) })}
                min="0"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
            
            {/* Event Type */}
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Event Type</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white"
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
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || isAvailable === false}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirm Booking"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}