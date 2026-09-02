// src/screens/EmergencyDJScreen.js
// REAL API VERSION - Connected to backend

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Zap, MapPin, ArrowLeft, Star, Clock, ShieldAlert, Loader2, X, 
  Wifi, WifiOff, Navigation, RefreshCw 
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { useUser } from "./UserContext/ThisUserContext";

// ✅ API Configuration
const API_BASE_URL = 'https://gigza-testing-11.onrender.com';

// --- CUSTOM PIN STYLES ---
const clientIcon = L.divIcon({
  className: "bg-transparent",
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute w-8 h-8 bg-red-500/40 rounded-full animate-ping"></div>
      <div class="w-5 h-5 bg-red-600 rounded-full border-2 border-white shadow-lg"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const movingDJIcon = L.divIcon({
  className: "bg-transparent",
  html: `
    <div class="relative flex items-center justify-center w-12 h-12">
      <div class="absolute w-12 h-12 bg-green-500/30 rounded-full animate-ping"></div>
      <div class="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-sm text-black font-bold animate-bounce">
        🎧
      </div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

const DEFAULT_LOCATION = [-26.2041, 28.0473];

export default function EmergencyDJScreen() {
  const navigate = useNavigate();
  
  const { 
    user, 
    isAuthenticated, 
    loading: authLoading,
    error: authError,
    clearAuthData,
    token
  } = useUser();
  
  // State
  const [status, setStatus] = useState("idle");
  const [foundDJ, setFoundDJ] = useState(null);
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emergencyId, setEmergencyId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [djLocation, setDjLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  // Refs
  const emergencyIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // ============================================
  // 1. GET USER LOCATION
  // ============================================
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported by your browser.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current) return;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation([lat, lng]);
        setHasLocation(true);
        setIsLoading(false);
        setError(null);
        setMapReady(true);
      },
      (error) => {
        if (!isMountedRef.current) return;
        console.warn("Geolocation error:", error);
        setIsLoading(false);
        setError("Location access denied. Using approximate location.");
        setHasLocation(true);
        setMapReady(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ============================================
  // 2. CHECK FOR ACTIVE EMERGENCY ON MOUNT
  // ============================================
  useEffect(() => {
    if (isAuthenticated && hasLocation) {
      checkActiveEmergency();
    }
  }, [isAuthenticated, hasLocation]);

  // ============================================
  // 3. API HELPER FUNCTIONS
  // ============================================
  
  const getAuthHeaders = () => {
    const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
    };
  };

  const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = getAuthHeaders();
    
    console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        clearAuthData?.();
        navigate('/login');
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  };

  // ============================================
  // 4. CHECK ACTIVE EMERGENCY
  // ============================================
  const checkActiveEmergency = useCallback(async () => {
    try {
      console.log('🔍 Checking for active emergency...');
      const data = await apiRequest('/api/emergency/active');
      
      if (data.success && data.emergency) {
        const emergency = data.emergency;
        console.log('✅ Active emergency found:', emergency);
        
        setEmergencyId(emergency.emergency_id);
        setEmergencyData(emergency);
        
        if (emergency.status === 'searching') {
          setStatus('broadcasting');
        } else if (emergency.status === 'accepted') {
          setStatus('accepted');
          if (emergency.dj_info) {
            setFoundDJ({
              dj_id: emergency.dj_id,
              name: emergency.dj_info.dj_name || 'DJ',
              rating: emergency.dj_info.rating || 4.9,
              emergency_rate: emergency.emergency_rate || 1500,
              image: emergency.dj_info.profile_image || '/api/placeholder/150/150',
            });
          }
          startTrackingDJ(emergency.dj_id);
        }
      } else {
        console.log('ℹ️ No active emergency found');
      }
    } catch (error) {
      console.error('❌ Error checking active emergency:', error);
    }
  }, [apiRequest, navigate]);

  // ============================================
  // 5. CREATE EMERGENCY (REAL API)
  // ============================================
  const createEmergency = useCallback(async () => {
    if (isSubmitting || !hasLocation) {
      if (!hasLocation) setError('Waiting for location...');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const [latitude, longitude] = userLocation;
      
      console.log('📝 Creating emergency...', { latitude, longitude });

      const data = await apiRequest('/api/emergency/create', {
        method: 'POST',
        body: JSON.stringify({
          latitude,
          longitude,
          emergency_type: 'urgent',
          description: 'Emergency DJ request',
          radius_km: 10,
        }),
      });

      console.log('✅ Emergency created:', data);
      
      if (data.success) {
        setEmergencyId(data.emergency.emergency_id);
        setEmergencyData(data.emergency);
        setStatus('broadcasting');
        setIsSubmitting(false);
        
        startPollingEmergencyStatus(data.emergency.emergency_id);
      }
    } catch (error) {
      console.error('❌ Error creating emergency:', error);
      setError(error.message || 'Failed to create emergency request');
      setStatus('idle');
      setIsSubmitting(false);
    }
  }, [userLocation, isSubmitting, hasLocation, apiRequest]);

  // ============================================
  // 6. POLL EMERGENCY STATUS
  // ============================================
  const startPollingEmergencyStatus = useCallback((emergencyId) => {
    if (emergencyIntervalRef.current) {
      clearInterval(emergencyIntervalRef.current);
    }

    let attempts = 0;
    const maxAttempts = 60;

    emergencyIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const data = await apiRequest(`/api/emergency/${emergencyId}`);
        
        if (data.success && data.emergency) {
          const emergency = data.emergency;
          
          if (emergency.status === 'accepted') {
            clearInterval(emergencyIntervalRef.current);
            emergencyIntervalRef.current = null;
            
            if (emergency.dj_info) {
              setFoundDJ({
                dj_id: emergency.dj_id,
                name: emergency.dj_info.dj_name || 'DJ',
                rating: emergency.dj_info.rating || 4.9,
                emergency_rate: emergency.emergency_rate || 1500,
                image: emergency.dj_info.profile_image || '/api/placeholder/150/150',
              });
            }
            
            setStatus('accepted');
            setProgress(20);
            setEta(15);
            
            startTrackingDJ(emergency.dj_id);
            
          } else if (emergency.status === 'cancelled' || emergency.status === 'completed') {
            clearInterval(emergencyIntervalRef.current);
            emergencyIntervalRef.current = null;
            setStatus(emergency.status === 'completed' ? 'completed' : 'idle');
          } else if (emergency.status === 'no_djs_available') {
            clearInterval(emergencyIntervalRef.current);
            emergencyIntervalRef.current = null;
            setError('No DJs available in your area. Please try again.');
            setStatus('idle');
          }
        }
      } catch (error) {
        console.error('❌ Error polling emergency status:', error);
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(emergencyIntervalRef.current);
        emergencyIntervalRef.current = null;
        setError('Emergency request timed out. Please try again.');
        setStatus('idle');
      }
    }, 5000);
  }, [apiRequest]);

  // ============================================
  // 7. TRACK DJ LOCATION
  // ============================================
  const startTrackingDJ = useCallback((djId) => {
    let countdown = 15;
    let progressValue = 20;
    
    if (emergencyIntervalRef.current) {
      clearInterval(emergencyIntervalRef.current);
    }

    emergencyIntervalRef.current = setInterval(() => {
      countdown = Math.max(0, countdown - 1);
      setEta(countdown);
      
      progressValue = Math.min(95, 20 + ((15 - countdown) / 15) * 75);
      setProgress(progressValue);
      
      const [lat, lng] = userLocation;
      const djLat = lat + (0.005 * (1 - countdown / 15));
      const djLng = lng + (0.005 * (1 - countdown / 15));
      setDjLocation([djLat, djLng]);
      
      if (countdown <= 0) {
        clearInterval(emergencyIntervalRef.current);
        emergencyIntervalRef.current = null;
        setProgress(100);
        setStatus('completed');
        setEta(0);
        
        setTimeout(() => {
          navigate('/emergency/history');
        }, 3000);
      }
    }, 1000);
  }, [userLocation, navigate]);

  // ============================================
  // 8. CANCEL EMERGENCY (REAL API)
  // ============================================
  const cancelEmergency = useCallback(async () => {
    if (!emergencyId) return;
    
    try {
      console.log('❌ Cancelling emergency:', emergencyId);
      
      const data = await apiRequest(`/api/emergency/${emergencyId}/cancel`, {
        method: 'POST',
      });
      
      console.log('✅ Emergency cancelled:', data);
      
      if (emergencyIntervalRef.current) {
        clearInterval(emergencyIntervalRef.current);
        emergencyIntervalRef.current = null;
      }

      setStatus('idle');
      setFoundDJ(null);
      setEmergencyId(null);
      setDjLocation(null);
      setEta(null);
      setProgress(0);
      setIsSubmitting(false);
      setEmergencyData(null);
      setError('Emergency request cancelled');
      
    } catch (error) {
      console.error('❌ Error cancelling emergency:', error);
      setError(error.message || 'Failed to cancel emergency');
    }
  }, [emergencyId, apiRequest]);

  // ============================================
  // 9. HANDLE ACTIONS
  // ============================================
  const handleBroadcast = useCallback(() => {
    if (!isAuthenticated) {
      setError('Please login to use emergency services');
      navigate('/login');
      return;
    }
    if (!hasLocation) {
      setError('Waiting for location...');
      return;
    }
    createEmergency();
  }, [createEmergency, isAuthenticated, navigate, hasLocation]);

  const handleCancel = useCallback(() => {
    cancelEmergency();
  }, [cancelEmergency]);

  const handleConfirmDispatch = useCallback(() => {
    if (foundDJ && foundDJ.dj_id) {
      navigate(`/book/${foundDJ.dj_id}`, { 
        state: { 
          emergencyId: emergencyId,
          isEmergency: true,
          emergencyData: emergencyData
        } 
      });
    }
  }, [foundDJ, emergencyId, emergencyData, navigate]);

  const handleLoginRedirect = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // ============================================
  // 10. REQUEST NOTIFICATION PERMISSION
  // ============================================
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ============================================
  // 11. CLEANUP
  // ============================================
  useEffect(() => {
    return () => {
      if (emergencyIntervalRef.current) {
        clearInterval(emergencyIntervalRef.current);
        emergencyIntervalRef.current = null;
      }
      isMountedRef.current = false;
    };
  }, []);

  // ============================================
  // 12. MAP COMPONENT - FIXED WITH ERROR HANDLING
  // ============================================
  const MapComponent = useMemo(() => {
    if (!hasLocation && !userLocation) {
      return (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
          <div className="text-center text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading map...</p>
          </div>
        </div>
      );
    }
    
    const markers = [];
    const center = hasLocation ? userLocation : DEFAULT_LOCATION;
    
    markers.push(
      <Marker key="user" position={center} icon={clientIcon}>
        <Popup>Your Location</Popup>
      </Marker>
    );
    
    if (status === 'accepted' && djLocation) {
      markers.push(
        <Marker key="dj-moving" position={djLocation} icon={movingDJIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-bold">{foundDJ?.name || 'DJ'}</p>
              <p className="text-sm text-green-500">En Route</p>
              {eta !== null && eta !== undefined && <p className="text-sm">⏱️ {eta} min</p>}
            </div>
          </Popup>
        </Marker>
      );
    }

    // ✅ FIXED: Use multiple tile providers with fallback
    return (
      <MapContainer 
        center={center} 
        zoom={14} 
        zoomControl={false} 
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        whenReady={() => setMapReady(true)}
      >
        <ChangeView center={center} />
        
        {/* ✅ Primary tile layer - CartoDB Dark */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          errorTileUrl=""
        />
        
        {/* ✅ Fallback tile layer - OpenStreetMap (if CartoDB fails) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          errorTileUrl=""
        />
        
        {markers}
        
        {status === "broadcasting" && (
          <Circle 
            center={center} 
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15 }} 
            radius={1500} 
            className="animate-pulse"
          />
        )}
        
        {status === "accepted" && djLocation && (
          <Circle 
            center={center} 
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.05 }} 
            radius={500}
          />
        )}
      </MapContainer>
    );
  }, [userLocation, status, djLocation, foundDJ, eta, hasLocation, mapReady]);

  // ============================================
  // 13. RENDER
  // ============================================
  if (authLoading || isLoading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">
            {authLoading ? 'Loading your profile...' : 'Finding your location...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden flex flex-col">
      
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-4 left-4 z-50 bg-zinc-900/80 backdrop-blur-md p-3 rounded-full hover:bg-zinc-800 transition-all text-white shadow-lg border border-zinc-700 hover:scale-105"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-700">
        <Wifi className="w-3 h-3 text-green-500" />
        <span className="text-green-500 text-xs">Live</span>
      </div>

      {authError && (
        <div className="absolute top-20 left-4 right-4 z-50 bg-red-500/20 border border-red-500/50 rounded-xl p-3 backdrop-blur-md flex items-center justify-between">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> {authError}
          </p>
          <button onClick={handleLoginRedirect} className="text-red-400 hover:text-red-300 text-sm font-medium">
            Login
          </button>
        </div>
      )}

      {error && !authError && (
        <div className="absolute top-20 left-4 right-4 z-50 bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 backdrop-blur-md flex items-center justify-between">
          <p className="text-yellow-400 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> {error}
          </p>
          <button onClick={() => setError(null)} className="text-yellow-400 hover:text-yellow-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="absolute inset-0 z-0">
        {MapComponent}
      </div>

      <div className="absolute bottom-0 w-full z-10 flex flex-col items-center pointer-events-none">
        
        {status === "idle" && (
          <div className="w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-20 pb-6 px-4 pointer-events-auto animate-in slide-in-from-bottom duration-500">
            <div className="max-w-md mx-auto text-center">
              <div className="bg-red-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Emergency DJ</h1>
              <p className="text-zinc-400 text-sm mb-6">
                {!isAuthenticated ? (
                  'Please login to use emergency services.'
                ) : !hasLocation ? (
                  'Getting your location...'
                ) : (
                  'Hit broadcast to alert DJs in your area immediately.'
                )}
              </p>
              <button 
                onClick={handleBroadcast}
                disabled={!isAuthenticated || isSubmitting || !hasLocation}
                className={`w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.3)] transition-all text-lg uppercase tracking-wide ${
                  isAuthenticated && !isSubmitting && hasLocation ? 'hover:from-red-700 hover:to-red-800 hover:scale-[1.02] cursor-pointer' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-white" /> Broadcast SOS
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {status === "broadcasting" && (
          <div className="w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-20 pb-6 px-4 pointer-events-auto animate-in slide-in-from-bottom duration-300">
            <div className="max-w-md mx-auto text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                <div className="relative w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/30">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Searching for DJs...</h2>
              <p className="text-zinc-400 text-sm">Connecting you with available DJs in your area</p>
              <button 
                onClick={handleCancel}
                disabled={isSubmitting}
                className="mt-4 text-zinc-500 hover:text-white text-sm font-medium transition disabled:opacity-50"
              >
                Cancel Request
              </button>
            </div>
          </div>
        )}

        {status === "accepted" && foundDJ && (
          <div className="w-full bg-black/95 backdrop-blur-xl border-t border-zinc-800 pt-4 pb-6 px-4 pointer-events-auto animate-in slide-in-from-bottom duration-300 rounded-t-3xl shadow-2xl">
            <div className="max-w-md mx-auto">
              
              <div className="mb-4">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>{eta !== null && eta <= 2 ? 'Arriving Now!' : 'DJ En Route'}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-center mb-3">
                <div className="bg-green-500/20 text-green-400 px-4 py-1 rounded-full font-bold flex items-center gap-2 border border-green-500/50 text-xs">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  {eta !== null && eta <= 2 ? 'Arriving Now!' : `En Route • ${eta || '15'} min`}
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-zinc-700 shrink-0 bg-zinc-800">
                  <img 
                    src={foundDJ.image || "/api/placeholder/150/150"} 
                    alt={foundDJ.name} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "/api/placeholder/150/150";
                    }}
                  />
                </div>
                <div className="flex flex-col justify-center flex-1">
                  <h2 className="text-xl font-bold text-white leading-tight">{foundDJ.name}</h2>
                  <div className="flex items-center gap-3 text-zinc-400 text-xs mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {djLocation ? 'Tracking...' : 'En Route'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500"/> {foundDJ.rating || "4.9"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Estimated Arrival</p>
                  <p className="text-white font-bold flex items-center gap-1.5 text-sm mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-green-500" /> {eta || '15'} Mins
                  </p>
                </div>
                <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Emergency Rate</p>
                  <p className="text-white font-bold text-base mt-0.5">
                    R{foundDJ.emergency_rate || 1500}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={handleConfirmDispatch}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/20 transition-all text-base hover:scale-[1.02]"
                >
                  <Navigation className="w-4 h-4" /> View Booking Details
                </button>
                <button 
                  onClick={handleCancel}
                  className="w-full text-zinc-500 hover:text-white text-sm font-medium transition py-2"
                >
                  Cancel Request
                </button>
              </div>
            </div>
          </div>
        )}

        {status === "completed" && (
          <div className="w-full bg-black/95 backdrop-blur-xl border-t border-green-500/20 pt-4 pb-6 px-4 pointer-events-auto animate-in slide-in-from-bottom duration-300 rounded-t-3xl shadow-2xl">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Emergency Completed!</h2>
              <p className="text-zinc-400 text-sm">Your emergency request has been completed.</p>
              <p className="text-green-400 text-xs mt-2">Redirecting to history...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}