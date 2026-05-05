import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, MapPin, ArrowLeft, Star, Clock, WifiOff } from "lucide-react";
import { useSocket } from "./UserContext/SocketContext";
import { useUser } from "./UserContext/ThisUserContext";

export function EmergencyDJScreen() {
  const navigate = useNavigate();
  const { searchNearbyDJs, nearbyDJs, isSearching: socketSearching, isConnected } = useSocket();
  const { user } = useUser();
  
  const [isSearching, setIsSearching] = useState(true);
  const [foundDJ, setFoundDJ] = useState(null);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(false);
  
  const searchTimerRef = useRef(null);
  const locationRetryCount = useRef(0);

  // Clear search timeout
  const clearSearchTimeout = () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  };

  // Start search timeout timer
  const startSearchTimeout = () => {
    clearSearchTimeout();
    setSearchTimeout(false);
    
    searchTimerRef.current = setTimeout(() => {
      console.log("Search timeout reached - no DJs found");
      if (isSearching && !foundDJ && !error) {
        setSearchTimeout(true);
        setError("No DJs found in your area after 5 seconds. Please try again or expand your search radius.");
        setIsSearching(false);
      }
    }, 5000); // 5 seconds timeout
  };

  // Get user's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsSearching(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        locationRetryCount.current = 0; // Reset retry count on success
        
        // Start searching for nearby DJs
        if (isConnected) {
          console.log("Starting search for DJs at:", latitude, longitude);
          searchNearbyDJs(latitude, longitude, 1.5);
          startSearchTimeout(); // Start the 5-second timeout
        } else {
          setError("Connecting to server...");
          setIsSearching(false);
        }
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
    
    return () => {
      clearSearchTimeout();
    };
  }, [isConnected]);

  // Listen for nearby DJs from socket
  useEffect(() => {
    // Only process if we're searching and have results
    if (!socketSearching && nearbyDJs.length > 0 && isSearching) {
      // Clear the timeout since we found results
      clearSearchTimeout();
      
      // Find the closest online DJ
      const onlineDJs = nearbyDJs.filter(dj => dj.is_online !== false);
      
      if (onlineDJs.length > 0) {
        const closestDJ = onlineDJs.sort((a, b) => 
          parseFloat(a.distance_km) - parseFloat(b.distance_km)
        )[0];

        console.log("Found closest DJ:", closestDJ);
        
        setTimeout(() => {
          setFoundDJ(closestDJ);
          setIsSearching(false);
          setError(null);
        }, 1000);
      } else if (nearbyDJs.length > 0) {
        // Found DJs but all are offline
        setError("Found DJs nearby, but none are currently online. Please try again later or use regular booking.");
        setIsSearching(false);
      }
    } else if (!socketSearching && nearbyDJs.length === 0 && isSearching && !searchTimeout) {
      // Don't show error immediately - wait for timeout
      console.log("Waiting for search results...");
    }
  }, [socketSearching, nearbyDJs, isSearching, searchTimeout]);

  // Handle search with custom radius
  const handleSearchWithRadius = (radiusKm) => {
    if (userLocation && isConnected) {
      setError(null);
      setIsSearching(true);
      setFoundDJ(null);
      setSearchTimeout(false);
      
      console.log(`Searching with radius: ${radiusKm}km`);
      searchNearbyDJs(userLocation.latitude, userLocation.longitude, radiusKm);
      startSearchTimeout();
    }
  };

  // Handle ride request
  const handleDispatchDJ = async (dj) => {
    if (!userLocation) {
      setError("Location not available");
      return;
    }

    try {
      navigate(`/book/${dj.dj_id}`, { 
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
    setSearchTimeout(false);
    
    if (userLocation && isConnected) {
      console.log("Retrying search...");
      searchNearbyDJs(userLocation.latitude, userLocation.longitude, 1.5);
      startSearchTimeout();
    } else if (userLocation) {
      setError("Connecting to server...");
    } else {
      // Try to get location again
      locationRetryCount.current++;
      if (locationRetryCount.current <= 3) {
        setLocationError(null);
        setIsSearching(true);
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });
            locationRetryCount.current = 0;
            
            if (isConnected) {
              searchNearbyDJs(latitude, longitude, 1.5);
              startSearchTimeout();
            }
          },
          (error) => {
            console.error("Location retry error:", error);
            setLocationError("Unable to get your location. Please enable location services.");
            setIsSearching(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        setLocationError("Unable to get your location after multiple attempts. Please check your settings.");
        setIsSearching(false);
      }
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

      {/* Connection Status */}
      {!isConnected && !error && (
        <div className="absolute top-6 right-6 z-50 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs flex items-center gap-2">
          <WifiOff className="w-3 h-3" /> Connecting...
        </div>
      )}

      {/* Search Timeout Warning (optional - show countdown) */}
      {isSearching && !searchTimeout && !error && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-full text-xs text-zinc-400">
          Searching for DJs...
        </div>
      )}

      {isSearching ? (
        // --- SCREEN 1: THE SEARCHING RADAR ---
        <div className="flex flex-col items-center z-10 mt-12">
          {/* The Radar Animation */}
          <div className="relative flex items-center justify-center w-64 h-64 mb-12">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-4 bg-red-500 rounded-full animate-ping opacity-40" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute inset-8 bg-red-500 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.4s' }}></div>
            <div className="relative z-10 bg-gradient-to-b from-red-500 to-red-700 w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.8)]">
              <Zap className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4 animate-pulse">
            SOS Activated
          </h1>
          <p className="text-zinc-400 max-w-sm text-lg">
            {locationError ? locationError : "Scanning your immediate area for available, verified DJs..."}
          </p>
          
          {locationError && (
            <button
              onClick={handleRetry}
              className="mt-6 bg-purple-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-purple-600 transition"
            >
              Try Again
            </button>
          )}
        </div>
      ) : error ? (
        // Error Screen with expanded radius option
        <div className="flex flex-col items-center z-10 mt-12">
          <div className="bg-red-500/20 text-red-500 px-6 py-3 rounded-full font-bold mb-8 flex items-center gap-2 border border-red-500/50">
            <Zap className="w-5 h-5" /> No DJs Found
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <p className="text-zinc-400 mb-6 text-sm sm:text-base">{error}</p>
            
            {/* Option to expand search radius */}
            {error.includes("No DJs found") && userLocation && (
              <div className="mb-6">
                <p className="text-zinc-500 text-xs mb-3">Try expanding your search radius:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSearchWithRadius(3)}
                    className="flex-1 bg-zinc-800 text-white text-sm py-2 rounded-lg hover:bg-zinc-700 transition"
                  >
                    3km radius
                  </button>
                  <button
                    onClick={() => handleSearchWithRadius(5)}
                    className="flex-1 bg-zinc-800 text-white text-sm py-2 rounded-lg hover:bg-zinc-700 transition"
                  >
                    5km radius
                  </button>
                  <button
                    onClick={() => handleSearchWithRadius(10)}
                    className="flex-1 bg-zinc-800 text-white text-sm py-2 rounded-lg hover:bg-zinc-700 transition"
                  >
                    10km radius
                  </button>
                </div>
              </div>
            )}
            
            <button
              onClick={handleRetry}
              className="w-full bg-purple-500 text-white font-bold py-3 rounded-xl hover:bg-purple-600 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full mt-3 text-zinc-500 hover:text-white text-sm transition"
            >
              Go Back Home
            </button>
          </div>
        </div>
      ) : foundDJ && (
        // --- SCREEN 2: DJ FOUND! ---
        <div className="flex flex-col items-center w-full max-w-md z-10 mt-12 animate-in fade-in zoom-in duration-500">
          <div className="bg-green-500/20 text-green-400 px-6 py-2 rounded-full font-bold mb-8 flex items-center gap-2 border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Zap className="w-5 h-5 fill-green-400" /> Emergency DJ Found!
          </div>

          <div className="bg-zinc-900 border border-zinc-800 w-full rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="h-32 overflow-hidden bg-gradient-to-r from-purple-900 to-pink-900">
              {foundDJ.avatar || foundDJ.image ? (
                <img 
                  src={foundDJ.avatar || foundDJ.image} 
                  alt={foundDJ.dj_name || foundDJ.name} 
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
              <h2 className="text-2xl font-bold text-white mb-1">
                {foundDJ.dj_name || foundDJ.name}
              </h2>
              <div className="flex items-center justify-center gap-4 text-zinc-400 text-sm mb-6">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> 
                  {parseFloat(foundDJ.distance_km).toFixed(1)} km away
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/> 
                  {parseFloat(foundDJ.average_rating || 4.5).toFixed(1)}
                </span>
              </div>

              {/* DJ Skills/Tags */}
              {foundDJ.dj_skills && (
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {foundDJ.dj_skills.split(',').slice(0, 3).map((skill, i) => (
                    <span key={i} className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Urgency Box */}
              <div className="bg-black rounded-2xl p-4 mb-6 border border-zinc-800 flex items-center justify-between">
                 <div className="text-left">
                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Estimated Arrival</p>
                    <p className="text-white font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-500"/> 
                      {Math.max(10, Math.ceil(parseFloat(foundDJ.distance_km) * 5))} - {Math.max(15, Math.ceil(parseFloat(foundDJ.distance_km) * 8))} Mins
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Emergency Rate</p>
                    <p className="text-white font-bold text-xl">
                      ${foundDJ.price ? Math.round(foundDJ.price * 1.5) : 150}
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
                className="mt-4 text-zinc-500 hover:text-white text-sm transition"
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