import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, MapPin, ArrowLeft, Star, Clock, RefreshCw, Loader2 } from "lucide-react";
import { useUser } from "./UserContext/ThisUserContext";
import { getNearbyDJs } from "./services/djService";

export function EmergencyDJScreen() {
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [isSearching, setIsSearching] = useState(true);
  const [foundDJ, setFoundDJ] = useState(null);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [isExpandingRadius, setIsExpandingRadius] = useState(false);
  const [nearbyDJsList, setNearbyDJsList] = useState([]);
  
  const searchTimerRef = useRef(null);
  const locationRetryCount = useRef(0);

  // Clear search timeout
  const clearSearchTimeout = () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  };

  // Search for nearby DJs using REST API
  const searchForNearbyDJs = async (latitude, longitude, radius) => {
    try {
      console.log(`🔍 Searching for DJs within ${radius}km of (${latitude}, ${longitude})`);
      
      const result = await getNearbyDJs(latitude, longitude, radius);
      
      console.log("📡 API Response:", result);
      
      if (result.success && result.djs && result.djs.length > 0) {
        // Sort by distance (already sorted by API)
        const sortedDJs = [...result.djs].sort((a, b) => 
          parseFloat(a.distance_km) - parseFloat(b.distance_km)
        );
        
        const closestDJ = sortedDJs[0];
        console.log(`✅ Found ${result.djs.length} DJs, closest is ${closestDJ.name} at ${closestDJ.distance_km}km`);
        
        return { success: true, dj: closestDJ, allDJs: sortedDJs, total: result.djs.length };
      } else {
        console.log(`❌ No DJs found within ${radius}km`);
        return { success: false, total: 0 };
      }
    } catch (err) {
      console.error("Error searching for DJs:", err);
      throw err;
    }
  };

  // Search with increasing radius until found
  const findClosestDJ = async (latitude, longitude, initialRadius = 10) => {
    setIsSearching(true);
    setError(null);
    setFoundDJ(null);
    setNearbyDJsList([]);
    setIsExpandingRadius(false);
    
    // Try increasing radii
    const radii = [5, 10, 20, 50];
    let startIndex = radii.indexOf(initialRadius);
    if (startIndex === -1) startIndex = 0;
    
    for (let i = startIndex; i < radii.length; i++) {
      const currentRadius = radii[i];
      setSearchRadius(currentRadius);
      
      if (i > startIndex) {
        setIsExpandingRadius(true);
      }
      
      console.log(`🔍 Trying radius: ${currentRadius}km`);
      
      try {
        const result = await searchForNearbyDJs(latitude, longitude, currentRadius);
        
        if (result.success && result.dj) {
          clearSearchTimeout();
          setFoundDJ(result.dj);
          setNearbyDJsList(result.allDJs || []);
          setIsSearching(false);
          setIsExpandingRadius(false);
          return;
        }
      } catch (err) {
        console.error(`Error searching radius ${currentRadius}km:`, err);
      }
      
      // If not found and not the last radius, continue to next radius
      if (i < radii.length - 1) {
        console.log(`No DJs within ${currentRadius}km, expanding to ${radii[i + 1]}km...`);
      }
    }
    
    // If we get here, no DJs found in any radius
    clearSearchTimeout();
    setError("No DJs found in your area within 50km. Please try again later or contact support.");
    setIsSearching(false);
    setIsExpandingRadius(false);
  };

  // Get user's current location and find closest DJ
  const getUserLocationAndFindDJ = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        locationRetryCount.current = 0;
        
        console.log(`📍 User location: ${latitude}, ${longitude}`);
        
        // Start searching for closest DJ
        await findClosestDJ(latitude, longitude, searchRadius);
      },
      (error) => {
        console.error("Location error:", error);
        
        let errorMessage = "Unable to get your location. ";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please enable location services in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again.";
            break;
          default:
            errorMessage += "Please check your location settings and try again.";
        }
        
        setLocationError(errorMessage);
        setIsSearching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Initialize on mount
  useEffect(() => {
    getUserLocationAndFindDJ();
    
    return () => {
      clearSearchTimeout();
    };
  }, []);

  // Handle search with custom radius
  const handleSearchWithRadius = async (radiusKm) => {
    if (userLocation) {
      setSearchRadius(radiusKm);
      setIsSearching(true);
      setError(null);
      setFoundDJ(null);
      setNearbyDJsList([]);
      setIsExpandingRadius(false);
      
      try {
        const result = await searchForNearbyDJs(userLocation.latitude, userLocation.longitude, radiusKm);
        
        if (result.success && result.dj) {
          setFoundDJ(result.dj);
          setNearbyDJsList(result.allDJs || []);
          setIsSearching(false);
        } else {
          setError(`No DJs found within ${radiusKm}km of your location. Try a larger radius.`);
          setIsSearching(false);
        }
      } catch (err) {
        setError(`Failed to search for DJs. Please try again.`);
        setIsSearching(false);
      }
    } else {
      getUserLocationAndFindDJ();
    }
  };

  // Handle DJ dispatch
  const handleDispatchDJ = async (dj) => {
    if (!userLocation) {
      setError("Location not available");
      return;
    }

    try {
      navigate(`/book/${dj.id}`, { 
        state: { 
          emergency: true, 
          dj: dj,
          userLocation: userLocation 
        } 
      });
    } catch (err) {
      console.error("Failed to request DJ:", err);
      setError("Failed to request DJ. Please try again.");
    }
  };

  // Retry search
  const handleRetry = () => {
    clearSearchTimeout();
    setError(null);
    setIsSearching(true);
    setFoundDJ(null);
    setNearbyDJsList([]);
    setIsExpandingRadius(false);
    
    if (userLocation) {
      findClosestDJ(userLocation.latitude, userLocation.longitude, searchRadius);
    } else {
      getUserLocationAndFindDJ();
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden text-center p-6">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-6 left-6 z-50 bg-zinc-900/80 backdrop-blur-md p-3 rounded-full hover:bg-zinc-800 transition text-white"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {isSearching ? (
        // SCREEN 1: SEARCHING RADAR
        <div className="flex flex-col items-center z-10 mt-12">
          {/* Radar Animation */}
          <div className="relative flex items-center justify-center w-64 h-64 mb-12">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-4 bg-red-500 rounded-full animate-ping opacity-40" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute inset-8 bg-red-500 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.4s' }}></div>
            <div className="absolute inset-12 bg-red-500 rounded-full animate-ping opacity-80" style={{ animationDelay: '0.6s' }}></div>
            
            <div className="relative z-10 bg-gradient-to-b from-red-500 to-red-700 w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.8)]">
              <Zap className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4 animate-pulse">
            {locationError ? "Location Error" : "Finding Closest DJ..."}
          </h1>
          <p className="text-zinc-400 max-w-sm text-lg">
            {locationError 
              ? locationError 
              : isExpandingRadius 
                ? `No DJs within ${searchRadius/2}km, expanding to ${searchRadius}km...`
                : `Scanning within ${searchRadius}km radius...`}
          </p>
          
          <div className="mt-6 flex items-center gap-2 text-purple-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Searching for available DJs near you</span>
          </div>
          
          {locationError && (
            <button
              onClick={handleRetry}
              className="mt-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-full text-sm font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      ) : error ? (
        // SCREEN 2: ERROR / NO DJs FOUND
        <div className="flex flex-col items-center w-full max-w-md z-10 mt-12">
          <div className="bg-red-500/20 text-red-400 px-6 py-2 rounded-full font-bold mb-8 flex items-center gap-2 border border-red-500/50">
            <Zap className="w-5 h-5" /> No DJs Found
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full">
            <p className="text-zinc-400 mb-6 text-center">
              {error}
            </p>
            
            {/* Expand search radius options */}
            {userLocation && (
              <div className="mb-6">
                <p className="text-zinc-500 text-xs mb-3 text-center">Try expanding your search radius:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSearchWithRadius(10)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2 rounded-lg transition"
                  >
                    10 km
                  </button>
                  <button
                    onClick={() => handleSearchWithRadius(20)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2 rounded-lg transition"
                  >
                    20 km
                  </button>
                  <button
                    onClick={() => handleSearchWithRadius(50)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2 rounded-lg transition"
                  >
                    50 km
                  </button>
                </div>
              </div>
            )}
            
            <button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition"
            >
              Try Again
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full mt-3 text-zinc-500 hover:text-white text-sm transition py-2"
            >
              Go Back Home
            </button>
          </div>
        </div>
      ) : foundDJ && (
        // SCREEN 3: DJ FOUND!
        <div className="flex flex-col items-center w-full max-w-md z-10 mt-12 animate-in fade-in zoom-in duration-500">
          <div className="bg-green-500/20 text-green-400 px-6 py-2 rounded-full font-bold mb-8 flex items-center gap-2 border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Zap className="w-5 h-5 fill-green-400" /> Closest DJ Found!
          </div>

          <div className="bg-zinc-900 border border-zinc-800 w-full rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="h-32 overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-red-600">
              {foundDJ.image ? (
                <img 
                  src={foundDJ.image} 
                  alt={foundDJ.name} 
                  className="w-full h-full object-cover opacity-80" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Zap className="w-12 h-12 text-white/50" />
                </div>
              )}
            </div>
            
            <div className="p-6 relative">
              {/* DJ Details */}
              <h2 className="text-2xl font-bold text-white mb-1">{foundDJ.name}</h2>
              <div className="flex items-center justify-center gap-4 text-zinc-400 text-sm mb-6">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> 
                  {foundDJ.distance_km} km away
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/> 
                  {parseFloat(foundDJ.rating || 4.5).toFixed(1)}
                </span>
              </div>

              {/* DJ Skills/Tags */}
              {foundDJ.skills && (
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {typeof foundDJ.skills === 'string' 
                    ? foundDJ.skills.split(',').slice(0, 3).map((skill, i) => (
                        <span key={i} className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">
                          {skill.trim()}
                        </span>
                      ))
                    : foundDJ.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">
                          {skill}
                        </span>
                      ))
                  }
                </div>
              )}

              {/* Genre Badge */}
              {foundDJ.genre && (
                <div className="flex justify-center mb-4">
                  <span className="bg-purple-500/20 text-purple-400 text-xs px-3 py-1 rounded-full">
                    {foundDJ.genre}
                  </span>
                </div>
              )}

              {/* Urgency Box */}
              <div className="bg-black rounded-2xl p-4 mb-6 border border-zinc-800 flex items-center justify-between">
                 <div className="text-left">
                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">ETA</p>
                    <p className="text-white font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-500"/> 
                      {foundDJ.distance_km 
                        ? `${Math.max(10, Math.ceil(parseFloat(foundDJ.distance_km) * 5))} - ${Math.max(15, Math.ceil(parseFloat(foundDJ.distance_km) * 8))} min`
                        : "15 - 20 Mins"}
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Emergency Rate</p>
                    <p className="text-white font-bold text-xl">
                      R{foundDJ.price ? Math.round(foundDJ.price * 1.5) : 225}
                    </p>
                 </div>
              </div>

              <button 
                onClick={() => handleDispatchDJ(foundDJ)}
                className="w-full flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/30 transition-all text-lg"
              >
                Dispatch DJ Now
              </button>
              <button 
                onClick={handleRetry}
                className="mt-4 text-zinc-500 hover:text-white text-sm transition w-full"
              >
                Search Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}