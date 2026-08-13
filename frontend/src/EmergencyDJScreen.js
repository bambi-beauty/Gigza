// src/screens/EmergencyDJScreen.js

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Zap, MapPin, ArrowLeft, Star, Clock, ShieldAlert, Loader2, X, 
  Wifi, WifiOff, Navigation, RefreshCw 
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";

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

const djIcon = L.divIcon({
  className: "bg-transparent",
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="w-6 h-6 bg-emerald-500 rounded-full border-2 border-zinc-900 shadow-xl flex items-center justify-center text-xs text-black font-bold">
        🎧
      </div>
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

// Helper component
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// ✅ CORRECT URL - Using Render deployment
const API_URL = 'https://gigza-testing-11.onrender.com';
const WS_URL = 'https://gigza-testing-11.onrender.com';

console.log('📍 API_URL:', API_URL);
console.log('📍 WS_URL:', WS_URL);

// Constants
const DEFAULT_LOCATION = [-26.2041, 28.0473];

// ============================================
// HELPER: Decode JWT Token
// ============================================
const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return null;
  }
};

// ✅ CHANGED: Use default export
export default function EmergencyDJScreen() {
  const navigate = useNavigate();
  
  // State
  const [status, setStatus] = useState("idle");
  const [foundDJ, setFoundDJ] = useState(null);
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [nearbyDJs, setNearbyDJs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emergencyId, setEmergencyId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [djLocation, setDjLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [progress, setProgress] = useState(0);
  const [authError, setAuthError] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [cachedUserId, setCachedUserId] = useState(null);
  
  // Refs
  const socketRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // ============================================
  // 1. GET AUTH TOKEN & USER (FIXED)
  // ============================================
  const getAuthToken = () => {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('accessToken') || 
                  localStorage.getItem('authToken') ||
                  sessionStorage.getItem('token') || 
                  sessionStorage.getItem('accessToken') || 
                  sessionStorage.getItem('authToken') ||
                  null;
    
    if (token) {
      console.log('✅ Token found:', token.substring(0, 20) + '...');
    } else {
      console.log('❌ No token found in storage');
      // Log all storage keys for debugging
      console.log('🔍 localStorage keys:', Object.keys(localStorage));
      console.log('🔍 sessionStorage keys:', Object.keys(sessionStorage));
    }
    
    return token;
  };

  const getUserId = () => {
    // First try to get from storage
    let userId = localStorage.getItem('userId') || 
                 localStorage.getItem('user_id') || 
                 localStorage.getItem('userid') ||
                 sessionStorage.getItem('userId') || 
                 sessionStorage.getItem('user_id') || 
                 sessionStorage.getItem('userid') ||
                 null;
    
    // If not in storage, try to decode from token
    if (!userId) {
      const token = getAuthToken();
      if (token) {
        try {
          const decoded = decodeToken(token);
          console.log('🔍 Decoded token:', decoded);
          
          if (decoded) {
            userId = decoded.userid || decoded.id || decoded.userId || decoded.sub || null;
            if (userId) {
              console.log('✅ User ID extracted from token:', userId);
              // Store it for future use
              localStorage.setItem('userId', String(userId));
              setCachedUserId(String(userId));
            }
          }
        } catch (err) {
          console.error('❌ Error decoding token:', err);
        }
      }
    }
    
    if (userId) {
      console.log('✅ User ID found:', userId);
      setCachedUserId(String(userId));
    } else {
      console.log('❌ No user ID found');
    }
    
    return userId;
  };

  // ============================================
  // 2. GET USER LOCATION
  // ============================================
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!mounted) return;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          setIsLoading(false);
        },
        (error) => {
          if (!mounted) return;
          console.warn("Geolocation denied. Using default location.", error);
          setError("Location access denied. Using approximate location.");
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError("Geolocation not supported by your browser.");
      setIsLoading(false);
    }

    return () => { mounted = false; };
  }, []);

  // ============================================
  // 3. WEBSOCKET CONNECTION
  // ============================================
  useEffect(() => {
    const token = getAuthToken();
    const userId = getUserId();
    
    // Don't connect if no token or user
    if (!token || !userId) {
      console.log('🔌 No token or user, skipping socket connection');
      setIsConnecting(false);
      setError('Please login to use emergency services');
      return;
    }

    console.log(`🔌 Connecting to WebSocket at: ${WS_URL}`);
    console.log(`🔑 Token: ${token.substring(0, 20)}...`);
    console.log(`👤 User ID: ${userId}`);

    setIsConnecting(true);

    // Create socket connection with proper auth
    const socket = io(WS_URL, {
      auth: { token: token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
      forceNew: true,
      withCredentials: true
    });

    socketRef.current = socket;

    // Socket event handlers
    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
      setIsConnecting(false);
      setAuthError(null);
      setError(null);
      setConnectionAttempts(0);
      
      // Join user room
      socket.emit('user:online', userId);
    });

    socket.on('authenticated', (data) => {
      console.log('✅ WebSocket authenticated:', data);
    });

    socket.on('auth_error', (data) => {
      console.error('❌ WebSocket auth error:', data);
      setAuthError(data.message || 'Authentication failed');
      setIsConnected(false);
      setIsConnecting(false);
    });

    socket.on('connect_error', (error) => {
      console.error('⚠️ WebSocket connection error:', error.message);
      setIsConnected(false);
      setIsConnecting(false);
      
      setConnectionAttempts(prev => prev + 1);
      
      if (error.message === 'Authentication required' || error.message === 'Invalid token') {
        setAuthError('Please login again');
      } else {
        setError(`Connection error (Attempt ${connectionAttempts + 1}/10). Retrying...`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // --- EMERGENCY EVENTS ---
    socket.on('emergency:accepted', (data) => {
      console.log('✅ Emergency accepted:', data);
      setStatus('accepted');
      setFoundDJ(data.dj);
      setEta(data.estimated_arrival || 15);
      setProgress(20);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('DJ Accepted!', {
          body: `${data.dj.name} is on their way! ETA: ${data.estimated_arrival || 15} mins`,
          icon: '/dj-icon.png'
        });
      }
    });

    socket.on('dj:locationUpdate', (data) => {
      console.log('📍 DJ Location Update:', data);
      if (data.djId === foundDJ?.dj_id) {
        setDjLocation([data.location.latitude, data.location.longitude]);
        
        if (userLocation) {
          const distance = calculateDistance(
            userLocation[0], userLocation[1],
            data.location.latitude, data.location.longitude
          );
          const newEta = Math.max(2, Math.min(Math.round((distance / 30) * 60), 45));
          setEta(newEta);
          setProgress(calculateProgress(distance));
        }
      }
    });

    socket.on('emergency:completed', (data) => {
      console.log('✅ Emergency completed:', data);
      setStatus('completed');
      setProgress(100);
      
      setTimeout(() => {
        navigate('/emergency/history');
      }, 3000);
    });

    socket.on('emergency:timeout', (data) => {
      console.log('⏰ Emergency timeout:', data);
      setStatus('idle');
      setError('No DJs available in your area. Please try again.');
      setEmergencyId(null);
    });

    socket.on('emergency:cancelled', (data) => {
      console.log('❌ Emergency cancelled:', data);
      setStatus('idle');
      setFoundDJ(null);
      setEmergencyId(null);
      setError('Emergency request cancelled');
    });

    socket.on('emergency:searching', (data) => {
      console.log('🔍 Searching for DJs:', data);
      setStatus('broadcasting');
      setEmergencyId(data.emergency_id);
    });

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [navigate]);

  // ============================================
  // 4. HELPER FUNCTIONS
  // ============================================
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateProgress = (distance) => {
    if (distance <= 0.5) return 95;
    if (distance <= 2) return 75;
    if (distance <= 5) return 50;
    if (distance <= 10) return 30;
    return 20;
  };

  // ============================================
  // 5. CREATE EMERGENCY (FIXED)
  // ============================================
  const createEmergency = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('Please login first');
        return;
      }

      // Get user ID - try cached first, then fresh
      let userId = cachedUserId || getUserId();
      
      if (!userId) {
        // Try to get from token directly
        const decoded = decodeToken(token);
        if (decoded) {
          userId = decoded.userid || decoded.id || decoded.userId || null;
          if (userId) {
            localStorage.setItem('userId', String(userId));
            setCachedUserId(String(userId));
          }
        }
      }

      if (!userId) {
        setError('Could not identify user. Please login again.');
        return;
      }

      console.log('📝 Creating emergency for user:', userId);
      setError(null);

      const requestBody = {
        latitude: userLocation[0],
        longitude: userLocation[1],
        emergency_type: 'general',
        description: 'Emergency DJ needed immediately',
        radius_km: 10
      };

      console.log('📤 Request body:', requestBody);

      const response = await fetch(`${API_URL}/api/emergency/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create emergency');
      }

      setEmergencyId(data.data.emergency_id);
      setStatus('broadcasting');
      
      // Emit via WebSocket
      if (socketRef.current && isConnected) {
        socketRef.current.emit('user:emergency', {
          userId: userId,
          emergencyId: data.data.emergency_id,
          latitude: userLocation[0],
          longitude: userLocation[1],
          emergencyType: 'general',
          description: 'Emergency DJ needed immediately',
          radiusKm: 10
        });
      }

    } catch (error) {
      console.error('❌ Error creating emergency:', error);
      setError(error.message || 'Failed to create emergency request');
      setStatus('idle');
    }
  }, [userLocation, isConnected, cachedUserId]);

  // ============================================
  // 6. CANCEL EMERGENCY (FIXED)
  // ============================================
  const cancelEmergency = useCallback(async () => {
    if (!emergencyId) {
      setStatus('idle');
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Please login first');
        return;
      }

      console.log('📝 Cancelling emergency:', emergencyId);

      const response = await fetch(`${API_URL}/api/emergency/cancel/${emergencyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'User cancelled request' })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel emergency');
      }

      if (socketRef.current && isConnected) {
        socketRef.current.emit('user:cancel-emergency', {
          emergencyId: emergencyId
        });
      }

      setStatus('idle');
      setFoundDJ(null);
      setEmergencyId(null);
      setDjLocation(null);
      setEta(null);
      setProgress(0);

    } catch (error) {
      console.error('❌ Error cancelling emergency:', error);
      setError(error.message || 'Failed to cancel emergency');
      setStatus('idle');
      setFoundDJ(null);
      setEmergencyId(null);
    }
  }, [emergencyId, isConnected]);

  // ============================================
  // 7. HANDLE ACTIONS
  // ============================================
  const handleBroadcast = useCallback(() => {
    if (!isConnected) {
      setError('Connection error. Please refresh and try again.');
      return;
    }
    createEmergency();
  }, [isConnected, createEmergency]);

  const handleCancel = useCallback(() => {
    cancelEmergency();
  }, [cancelEmergency]);

  const handleConfirmDispatch = useCallback(() => {
    if (foundDJ && foundDJ.dj_id) {
      navigate(`/book/${foundDJ.dj_id}`, { 
        state: { 
          emergencyId: emergencyId,
          isEmergency: true 
        } 
      });
    }
  }, [foundDJ, emergencyId, navigate]);

  const handleRetryConnection = useCallback(() => {
    setError(null);
    setAuthError(null);
    setIsConnecting(true);
    setConnectionAttempts(0);
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      setTimeout(() => {
        socketRef.current.connect();
      }, 1000);
    }
  }, []);

  // ============================================
  // 8. REQUEST NOTIFICATION PERMISSION
  // ============================================
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ============================================
  // 9. MAP COMPONENT
  // ============================================
  const MapComponent = useMemo(() => {
    const markers = [];
    
    markers.push(
      <Marker key="user" position={userLocation} icon={clientIcon}>
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
              {eta && <p className="text-sm">⏱️ {eta} min</p>}
            </div>
          </Popup>
        </Marker>
      );
    }

    return (
      <MapContainer 
        center={userLocation} 
        zoom={14} 
        zoomControl={false} 
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <ChangeView center={userLocation} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {markers}
        
        {status === "broadcasting" && (
          <Circle 
            center={userLocation} 
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15 }} 
            radius={1500} 
            className="animate-pulse"
          />
        )}
        
        {status === "accepted" && djLocation && (
          <Circle 
            center={userLocation} 
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.05 }} 
            radius={500}
          />
        )}
      </MapContainer>
    );
  }, [userLocation, status, djLocation, foundDJ, eta]);

  // ============================================
  // 10. RENDER
  // ============================================
  if (isLoading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Finding your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden flex flex-col">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-4 left-4 z-50 bg-zinc-900/80 backdrop-blur-md p-3 rounded-full hover:bg-zinc-800 transition-all text-white shadow-lg border border-zinc-700 hover:scale-105"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-700">
        {isConnecting ? (
          <>
            <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />
            <span className="text-yellow-500 text-xs">Connecting...</span>
          </>
        ) : isConnected ? (
          <>
            <Wifi className="w-3 h-3 text-green-500" />
            <span className="text-green-500 text-xs">Live</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-red-500" />
            <span className="text-red-500 text-xs">Offline</span>
          </>
        )}
      </div>

      {/* Auth Error Toast */}
      {authError && (
        <div className="absolute top-20 left-4 right-4 z-50 bg-red-500/20 border border-red-500/50 rounded-xl p-3 backdrop-blur-md flex items-center justify-between">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> {authError}
          </p>
          <button onClick={() => navigate('/login')} className="text-red-400 hover:text-red-300 text-sm font-medium">
            Login
          </button>
        </div>
      )}

      {/* Error Toast */}
      {error && !authError && (
        <div className="absolute top-20 left-4 right-4 z-50 bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 backdrop-blur-md flex items-center justify-between">
          <p className="text-yellow-400 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> {error}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={handleRetryConnection} className="text-yellow-400 hover:text-yellow-300">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setError(null)} className="text-yellow-400 hover:text-yellow-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="absolute inset-0 z-0">
        {MapComponent}
      </div>

      {/* Bottom UI */}
      <div className="absolute bottom-0 w-full z-10 flex flex-col items-center pointer-events-none">
        
        {/* IDLE STATE */}
        {status === "idle" && (
          <div className="w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-20 pb-6 px-4 pointer-events-auto animate-in slide-in-from-bottom duration-500">
            <div className="max-w-md mx-auto text-center">
              <div className="bg-red-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Emergency DJ</h1>
              <p className="text-zinc-400 text-sm mb-6">
                {!authError ? (
                  isConnected ? (
                    `Hit broadcast to alert DJs in your area immediately.`
                  ) : isConnecting ? (
                    'Connecting to server... Please wait.'
                  ) : (
                    'Connection lost. Please refresh the page.'
                  )
                ) : (
                  'Please login to use emergency services.'
                )}
              </p>
              <button 
                onClick={handleBroadcast}
                disabled={!isConnected || !!authError}
                className={`w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.3)] transition-all text-lg uppercase tracking-wide ${
                  isConnected && !authError ? 'hover:from-red-700 hover:to-red-800 hover:scale-[1.02] cursor-pointer' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <Zap className="w-5 h-5 fill-white" /> Broadcast SOS
              </button>
            </div>
          </div>
        )}

        {/* BROADCASTING STATE */}
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
                className="mt-4 text-zinc-500 hover:text-white text-sm font-medium transition"
              >
                Cancel Request
              </button>
            </div>
          </div>
        )}

        {/* ACCEPTED/TRACKING STATE */}
        {status === "accepted" && foundDJ && (
          <div className="w-full bg-black/95 backdrop-blur-xl border-t border-zinc-800 pt-4 pb-6 px-4 pointer-events-auto animate-in slide-in-from-bottom duration-300 rounded-t-3xl shadow-2xl">
            <div className="max-w-md mx-auto">
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>{eta && eta <= 2 ? 'Arriving Now!' : 'DJ En Route'}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Match Badge */}
              <div className="flex justify-center mb-3">
                <div className="bg-green-500/20 text-green-400 px-4 py-1 rounded-full font-bold flex items-center gap-2 border border-green-500/50 text-xs">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  {eta && eta <= 2 ? 'Arriving Now!' : `En Route • ${eta || '15'} min`}
                </div>
              </div>

              {/* DJ Info */}
              <div className="flex gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-zinc-700 shrink-0 bg-zinc-800">
                  <img 
                    src={foundDJ.image || "/api/placeholder/150/150"} 
                    alt={foundDJ.name} 
                    className="w-full h-full object-cover"
                    loading="lazy"
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

              {/* ETA and Rate */}
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

              {/* Actions */}
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

        {/* COMPLETED STATE */}
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