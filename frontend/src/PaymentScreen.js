import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, MapPin, ArrowLeft, Minus, Plus, Banknote, Users, Music } from "lucide-react";
import { allDJs } from "./data"; 

export function PaymentScreen() {
  const { djId } = useParams(); 
  const navigate = useNavigate();
  
  const [dj, setDj] = useState(null);
  
  // --- The Complete Form State ---
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [hours, setHours] = useState(4); 
  const [eventType, setEventType] = useState("Private Party");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [location, setLocation] = useState("");
  const [guests, setGuests] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const availableGenres = ["House", "Techno", "Hip Hop", "EDM", "RnB", "Trance", "Drum & Bass", "Pop"];

  useEffect(() => {
    const selectedDj = allDJs.find(d => d.id.toString() === djId);
    if (selectedDj) {
      setDj(selectedDj);
    } else {
      setDj(allDJs[0]);
    }
  }, [djId]);

  // Handle clicking genre buttons
  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handlePayment = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const existingBookings = JSON.parse(localStorage.getItem("gigzaBookings")) || [];
      
      const newBooking = {
        id: `BK-${Math.floor(Math.random() * 10000)}`,
        djId: dj.id,
        djName: dj.name,
        djImage: dj.image,
        eventType: eventType,
        date: eventDate || new Date().toLocaleDateString(), 
        time: startTime,
        location: location || "Location TBD",
        duration: `${hours} Hours`,
        guests: guests,
        genres: selectedGenres,
        notes: notes,
        status: "Upcoming",
        totalPaid: dj.price * hours
      };

      localStorage.setItem("gigzaBookings", JSON.stringify([newBooking, ...existingBookings]));
      navigate("/bookings");
    }, 2000);
  };

  if (!dj) return <div className="min-h-screen bg-black text-white text-center pt-20">Loading DJ...</div>;

  const totalCost = dj.price * hours;

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/40 to-black px-6 pt-8 pb-6 border-b border-zinc-800 flex items-center gap-4 sticky top-0 z-10 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="bg-zinc-900 rounded-full p-2 hover:bg-zinc-800 transition">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Book {dj.name}</h1>
          <p className="text-zinc-400 text-sm">Fill out your event details</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 mt-6 space-y-8">
        
        {/* Section 1: Date & Time */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" /> Date & Time
          </h2>
          
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Event Date</label>
            <input 
              type="date" 
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-zinc-400 text-sm mb-1 block">Start Time</label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
              />
            </div>
            
            <div className="flex-1">
              <label className="text-zinc-400 text-sm mb-1 block">Duration (hrs)</label>
              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-2.5">
                <button onClick={() => setHours(Math.max(1, hours - 1))} className="bg-zinc-800 p-1.5 rounded-lg hover:bg-zinc-700 text-white transition"><Minus className="w-4 h-4" /></button>
                <span className="text-white font-bold w-4 text-center">{hours}</span>
                <button onClick={() => setHours(hours + 1)} className="bg-purple-500 p-1.5 rounded-lg hover:bg-purple-600 text-white transition"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-zinc-800" />

        {/* Section 2: Event Type & Genres */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-400" /> Vibe & Music
          </h2>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Event Type</label>
            <select 
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            >
              <option>Wedding</option>
              <option>Birthday Party</option>
              <option>Corporate Event</option>
              <option>Club Night</option>
              <option>Private Party</option>
              <option>Festival</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-3 block">Preferred Genres (Select multiple)</label>
            <div className="flex flex-wrap gap-2">
              {availableGenres.map(genre => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedGenres.includes(genre) 
                      ? "bg-purple-500 text-white border-transparent" 
                      : "bg-zinc-900 text-zinc-400 border border-zinc-700 hover:border-purple-500 hover:text-white"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-zinc-800" />

        {/* Section 3: Event Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" /> Event Details
          </h2>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Location</label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" />
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Venue name or address"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-zinc-400 text-sm mb-1 block">Expected Guests</label>
              <input 
                type="number" 
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder="e.g. 150"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div className="flex-1">
              <label className="text-zinc-400 text-sm mb-1 block">Expected Budget (R)</label>
              <input 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Additional Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests for the DJ?"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 h-24 resize-none"
            ></textarea>
          </div>
        </div>

        {/* Section 4: Total & Checkout Block */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mt-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-zinc-400 text-sm mb-1">Final DJ Fee</p>
              <h2 className="text-3xl font-bold text-white">R{totalCost}</h2>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs">Based on {hours} hours</p>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? "Processing Booking..." : (
              <>
                <Banknote className="w-5 h-5" /> Continue to Payment
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}