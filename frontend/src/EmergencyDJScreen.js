// src/screens/EmergencyDJScreen.js
// Uber-style emergency DJ dispatch

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, MapPin, ArrowLeft, Star, Clock, ShieldAlert, Loader2, X,
  Wifi, Navigation, Crosshair, Phone,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { useUser } from "./UserContext/ThisUserContext";
import { useTranslation } from "./hooks/useTranslation";

/* ============================================================
   Config
   ============================================================ */

const API_BASE_URL = "https://gigza-testing-11.onrender.com";
const DEFAULT_LOCATION = [-26.2041, 28.0473];
const RETRY_DELAY_MS = 5000;
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 60;
const ARRIVAL_SIM_SECONDS = 15;

/* ============================================================
   Map icons
   ============================================================ */

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
    if (center) map.flyTo(center, 14, { duration: 1.2 });
  }, [center, map]);
  return null;
}

function RecenterControl({ center }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.flyTo(center, 15, { duration: 0.8 })}
      aria-label="Recenter map"
      className="absolute bottom-6 right-6 z-[400] w-11 h-11 rounded-full bg-zinc-900/95 backdrop-blur-md border border-zinc-700 shadow-xl flex items-center justify-center text-white hover:bg-zinc-800 active:scale-95 transition-all"
    >
      <Crosshair className="w-5 h-5" />
    </button>
  );
}

/* ============================================================
   Small reusable pieces
   ============================================================ */

function StageIndicator({ status }) {
  const stages = ["idle", "broadcasting", "accepted", "completed"];
  const currentIndex = stages.indexOf(status);
  return (
    <div className="flex items-center gap-1.5" role="status" aria-live="polite">
      {stages.map((s, i) => (
        <span
          key={s}
          className={`h-1 rounded-full transition-all duration-500 ${
            i <= currentIndex ? "w-6 bg-white" : "w-3 bg-white/30"
          }`}
        />
      ))}
    </div>
  );
}

function RetryBanner({ secondsLeft, onRetry, t }) {
  return (
    <div
      role="alert"
      className="mx-4 mb-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-xl p-3.5 flex items-center gap-3 animate-in slide-in-from-bottom duration-300"
    >
      <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
        <ShieldAlert className="w-4 h-4 text-yellow-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-yellow-200">{t("retryingIn")} {secondsLeft}s</p>
        <p className="text-xs text-yellow-300/70 truncate">{t("autoRetryHint")}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
      >
        {t("retryNow")}
      </button>
    </div>
  );
}

function ErrorBanner({ message, onDismiss, onRetry, t }) {
  return (
    <div
      role="alert"
      className="mx-4 mb-3 rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-xl p-3.5 flex items-center gap-3 animate-in slide-in-from-bottom duration-300"
    >
      <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
        <ShieldAlert className="w-4 h-4 text-red-400" />
      </div>
      <p className="flex-1 text-sm text-red-200 line-clamp-2">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          {t("tryAgain")}
        </button>
      )}
      <button
        onClick={onDismiss}
        aria-label={t("dismiss")}
        className="p-1.5 rounded-lg text-red-300 hover:bg-red-500/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ConfirmSheet({ title, body, confirmLabel, cancelLabel, onConfirm, onCancel, destructive = true }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-800 shadow-2xl p-6 animate-in slide-in-from-bottom duration-300"
      >
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-zinc-400 mb-6">{body}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 ${
              destructive
                ? "bg-red-600 hover:bg-red-500 focus-visible:ring-red-400"
                : "bg-green-600 hover:bg-green-500 focus-visible:ring-green-400"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Main screen
   ============================================================ */

export default function EmergencyDJScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    isAuthenticated,
    loading: authLoading,
    error: authError,
    clearAuthData,
    token,
  } = useUser();

  /* ---------------- State ---------------- */
  const [status, setStatus] = useState("idle");
  const [foundDJ, setFoundDJ] = useState(null);
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emergencyId, setEmergencyId] = useState(null);
  const [djLocation, setDjLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Retry machinery
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [pendingRetry, setPendingRetry] = useState(null);

  // Cancel confirmation
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  /* ---------------- Refs ---------------- */
  const emergencyIntervalRef = useRef(null);
  const retryIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const actionRef = useRef(null); // holds the fn we want to retry

  /* ============================================================
     Helpers
     ============================================================ */

  const getAuthHeaders = useCallback(() => {
    const authToken = token || localStorage.getItem("token") || sessionStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: authToken ? `Bearer ${authToken}` : "",
    };
  }, [token]);

  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: { ...getAuthHeaders(), ...options.headers },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthData?.();
          navigate("/login");
          throw new Error(t("sessionExpiredLogin"));
        }
        throw new Error(data.message || t("apiRequestFailed"));
      }
      return data;
    },
    [getAuthHeaders, clearAuthData, navigate, t]
  );

  /* ============================================================
     Retry with countdown
     ============================================================ */

  const scheduleRetry = useCallback((fn) => {
    // Clear any existing retry
    if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);

    actionRef.current = fn;
    setRetrySeconds(Math.ceil(RETRY_DELAY_MS / 1000));

    retryIntervalRef.current = setInterval(() => {
      setRetrySeconds((s) => {
        if (s <= 1) {
          clearInterval(retryIntervalRef.current);
          retryIntervalRef.current = null;
          setPendingRetry(null);
          // Fire the retry
          setTimeout(() => actionRef.current?.(), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const cancelRetry = useCallback(() => {
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
    }
    setRetrySeconds(0);
    setPendingRetry(null);
  }, []);

  /* ============================================================
     Location
     ============================================================ */

  useEffect(() => {
    isMountedRef.current = true;

    if (!("geolocation" in navigator)) {
      setError(t("geoNotSupported"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current) return;
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setHasLocation(true);
        setIsLoading(false);
        setError(null);
        setMapReady(true);
      },
      (err) => {
        if (!isMountedRef.current) return;
        console.warn("Geolocation error:", err);
        setIsLoading(false);
        setError(t("geoDenied"));
        setHasLocation(true);
        setMapReady(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      isMountedRef.current = false;
    };
  }, [t]);

  /* ============================================================
     Check active emergency on mount
     ============================================================ */

  const checkActiveEmergency = useCallback(async () => {
    try {
      const data = await apiRequest("/api/emergency/active");
      if (!data.success || !data.emergency) return;

      const emergency = data.emergency;
      setEmergencyId(emergency.emergency_id);
      setEmergencyData(emergency);

      if (emergency.status === "searching") {
        setStatus("broadcasting");
      } else if (emergency.status === "accepted") {
        setStatus("accepted");
        if (emergency.dj_info) {
          setFoundDJ({
            dj_id: emergency.dj_id,
            name: emergency.dj_info.dj_name || t("djGeneric"),
            rating: emergency.dj_info.rating || 4.9,
            emergency_rate: emergency.emergency_rate || 1500,
            image: emergency.dj_info.profile_image || "/api/placeholder/150/150",
          });
        }
        startTrackingDJ(emergency.dj_id);
      }
    } catch (err) {
      console.error("Error checking active emergency:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiRequest, t]);

  useEffect(() => {
    if (isAuthenticated && hasLocation) checkActiveEmergency();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, hasLocation]);

  /* ============================================================
     Create emergency
     ============================================================ */

  const createEmergency = useCallback(async () => {
    if (isSubmitting || !hasLocation) return;

    try {
      setIsSubmitting(true);
      setError(null);
      cancelRetry();

      const [latitude, longitude] = userLocation;
      const data = await apiRequest("/api/emergency/create", {
        method: "POST",
        body: JSON.stringify({
          latitude,
          longitude,
          emergency_type: "urgent",
          description: "Emergency DJ request",
          radius_km: 10,
        }),
      });

      if (data.success) {
        setEmergencyId(data.emergency.emergency_id);
        setEmergencyData(data.emergency);
        setStatus("broadcasting");
        setIsSubmitting(false);
        startPollingEmergencyStatus(data.emergency.emergency_id);
      }
    } catch (err) {
      console.error("Error creating emergency:", err);
      setError(err.message || t("createEmergencyFailed"));
      setStatus("idle");
      setIsSubmitting(false);
      scheduleRetry(() => createEmergency());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, isSubmitting, hasLocation, apiRequest, t, scheduleRetry, cancelRetry]);

  /* ============================================================
     Poll emergency status
     ============================================================ */

  const startPollingEmergencyStatus = useCallback(
    (id) => {
      if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);

      let attempts = 0;

      emergencyIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const data = await apiRequest(`/api/emergency/${id}`);
          if (!data.success || !data.emergency) return;

          const emergency = data.emergency;

          if (emergency.status === "accepted") {
            clearInterval(emergencyIntervalRef.current);
            emergencyIntervalRef.current = null;

            if (emergency.dj_info) {
              setFoundDJ({
                dj_id: emergency.dj_id,
                name: emergency.dj_info.dj_name || t("djGeneric"),
                rating: emergency.dj_info.rating || 4.9,
                emergency_rate: emergency.emergency_rate || 1500,
                image: emergency.dj_info.profile_image || "/api/placeholder/150/150",
              });
            }
            setStatus("accepted");
            setProgress(20);
            setEta(ARRIVAL_SIM_SECONDS);
            startTrackingDJ(emergency.dj_id);
          } else if (["cancelled", "completed"].includes(emergency.status)) {
            clearInterval(emergencyIntervalRef.current);
            emergencyIntervalRef.current = null;
            setStatus(emergency.status === "completed" ? "completed" : "idle");
          } else if (emergency.status === "no_djs_available") {
            clearInterval(emergencyIntervalRef.current);
            emergencyIntervalRef.current = null;
            setError(t("noDJsAvailable"));
            setStatus("idle");
          }
        } catch (err) {
          console.error("Error polling emergency status:", err);
        }

        if (attempts >= POLL_MAX_ATTEMPTS) {
          clearInterval(emergencyIntervalRef.current);
          emergencyIntervalRef.current = null;
          setError(t("emergencyTimedOut"));
          setStatus("idle");
        }
      }, POLL_INTERVAL_MS);
    },
    [apiRequest, t]
  );

  /* ============================================================
     Track DJ movement (simulated)
     ============================================================ */

  const startTrackingDJ = useCallback(
    (djId) => {
      let countdown = ARRIVAL_SIM_SECONDS;
      let progressValue = 20;

      if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);

      emergencyIntervalRef.current = setInterval(() => {
        countdown = Math.max(0, countdown - 1);
        setEta(countdown);

        progressValue = Math.min(95, 20 + ((ARRIVAL_SIM_SECONDS - countdown) / ARRIVAL_SIM_SECONDS) * 75);
        setProgress(progressValue);

        const [lat, lng] = userLocation;
        const ratio = 1 - countdown / ARRIVAL_SIM_SECONDS;
        setDjLocation([lat + 0.005 * ratio, lng + 0.005 * ratio]);

        if (countdown <= 0) {
          clearInterval(emergencyIntervalRef.current);
          emergencyIntervalRef.current = null;
          setProgress(100);
          setStatus("completed");
          setEta(0);
          setTimeout(() => navigate("/emergency/history"), 3000);
        }
      }, 1000);
    },
    [userLocation, navigate]
  );

  /* ============================================================
     Cancel emergency
     ============================================================ */

  const doCancelEmergency = useCallback(async () => {
    if (!emergencyId) return;
    try {
      await apiRequest(`/api/emergency/${emergencyId}/cancel`, { method: "POST" });

      if (emergencyIntervalRef.current) {
        clearInterval(emergencyIntervalRef.current);
        emergencyIntervalRef.current = null;
      }
      cancelRetry();

      setStatus("idle");
      setFoundDJ(null);
      setEmergencyId(null);
      setDjLocation(null);
      setEta(null);
      setProgress(0);
      setIsSubmitting(false);
      setEmergencyData(null);
    } catch (err) {
      console.error("Error cancelling emergency:", err);
      setError(err.message || t("cancelEmergencyFailed"));
    }
  }, [emergencyId, apiRequest, cancelRetry, t]);

  /* ============================================================
     Actions
     ============================================================ */

  const handleBroadcast = useCallback(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!hasLocation) {
      setError(t("waitingForLocation"));
      return;
    }
    createEmergency();
  }, [createEmergency, isAuthenticated, navigate, hasLocation, t]);

  const handleCancelClick = () => {
    if (status === "broadcasting" || status === "accepted") {
      setShowCancelConfirm(true);
    } else {
      doCancelEmergency();
    }
  };

  const handleConfirmDispatch = useCallback(() => {
    if (foundDJ?.dj_id) {
      navigate(`/book/${foundDJ.dj_id}`, {
        state: { emergencyId, isEmergency: true, emergencyData },
      });
    }
  }, [foundDJ, emergencyId, emergencyData, navigate]);

  /* ============================================================
     Notification permission
     ============================================================ */

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ============================================================
     Cleanup
     ============================================================ */

  useEffect(() => {
    return () => {
      if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);
      if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
      isMountedRef.current = false;
    };
  }, []);

  /* ============================================================
     Map
     ============================================================ */

  const MapComponent = useMemo(() => {
    if (!hasLocation && !userLocation) {
      return (
        <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
          <div className="text-center text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">{t("loadingMap")}</p>
          </div>
        </div>
      );
    }

    const center = hasLocation ? userLocation : DEFAULT_LOCATION;
    const markers = [
      <Marker key="user" position={center} icon={clientIcon}>
        <Popup>{t("yourLocation")}</Popup>
      </Marker>,
    ];

    if (status === "accepted" && djLocation) {
      markers.push(
        <Marker key="dj-moving" position={djLocation} icon={movingDJIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-bold">{foundDJ?.name || t("djGeneric")}</p>
              <p className="text-sm text-green-500">{t("enRoute")}</p>
              {eta != null && <p className="text-sm">⏱️ {eta} {t("minShort")}</p>}
            </div>
          </Popup>
        </Marker>
      );
    }

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
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />
        {markers}

        {status === "broadcasting" && (
          <Circle
            center={center}
            pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.12 }}
            radius={1500}
          />
        )}
        {status === "accepted" && djLocation && (
          <Circle
            center={center}
            pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.06 }}
            radius={500}
          />
        )}
        <RecenterControl center={center} />
      </MapContainer>
    );
  }, [userLocation, status, djLocation, foundDJ, eta, hasLocation, mapReady, t]);

  /* ============================================================
     Render
     ============================================================ */

  if (authLoading || isLoading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">
            {authLoading ? t("loadingYourProfile") : t("findingYourLocation")}
          </p>
        </div>
      </div>
    );
  }

  const showCancelConfirmSheet = showCancelConfirm;

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-start justify-between pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          aria-label={t("back")}
          className="pointer-events-auto w-11 h-11 rounded-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/60 shadow-xl flex items-center justify-center text-white hover:bg-zinc-800 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-xl px-3 py-1.5 rounded-full border border-zinc-700/60">
            <Wifi className="w-3 h-3 text-green-500" />
            <span className="text-green-500 text-xs font-medium">{t("live")}</span>
          </div>
          <StageIndicator status={status} />
        </div>
      </div>

      {/* Map */}
      <div className="absolute inset-0 z-0">{MapComponent}</div>

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">

        {/* Error / retry banners */}
        <div className="pointer-events-auto">
          {error && !authError && (
            <ErrorBanner
              message={error}
              onDismiss={() => setError(null)}
              onRetry={status === "idle" && hasLocation ? () => createEmergency() : null}
              t={t}
            />
          )}
          {pendingRetry && retrySeconds > 0 && (
            <RetryBanner
              secondsLeft={retrySeconds}
              onRetry={() => {
                cancelRetry();
                actionRef.current?.();
              }}
              t={t}
            />
          )}
        </div>

        {/* Idle state */}
        {status === "idle" && (
          <div className="pointer-events-auto bg-gradient-to-t from-black via-black/95 to-transparent pt-24 pb-8 px-5 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5 relative">
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                <ShieldAlert className="w-10 h-10 text-red-500 relative" />
              </div>

              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {t("emergencyTitle")}
              </h1>
              <p className="text-zinc-400 text-sm mb-7 max-w-xs mx-auto">
                {!isAuthenticated
                  ? t("loginForEmergency")
                  : !hasLocation
                  ? t("gettingYourLocation")
                  : t("emergencyIntro")}
              </p>

              <button
                onClick={handleBroadcast}
                disabled={!isAuthenticated || isSubmitting || !hasLocation}
                className={`w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.35)] transition-all text-base uppercase tracking-wider ${
                  isAuthenticated && !isSubmitting && hasLocation
                    ? "hover:from-red-500 hover:to-red-600 hover:scale-[1.015] active:scale-[0.99]"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("processing")}
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-white" />
                    {t("broadcastSOS")}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Broadcasting */}
        {status === "broadcasting" && (
          <div className="pointer-events-auto bg-gradient-to-t from-black via-black/95 to-transparent pt-24 pb-8 px-5 animate-in slide-in-from-bottom duration-300">
            <div className="max-w-md mx-auto text-center">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full bg-red-500/25 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-red-500/20 animate-ping [animation-delay:0.4s]" />
                <div className="relative w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-1.5">{t("searchingForDJs")}</h2>
              <p className="text-zinc-400 text-sm mb-6">{t("connectingWithDJs")}</p>

              <button
                onClick={handleCancelClick}
                className="text-zinc-400 hover:text-white text-sm font-medium transition-colors py-2 px-4 rounded-lg hover:bg-white/5"
              >
                {t("cancelRequest")}
              </button>
            </div>
          </div>
        )}

        {/* Accepted — Uber-style driver card */}
        {status === "accepted" && foundDJ && (
          <div className="pointer-events-auto bg-zinc-950/98 backdrop-blur-2xl border-t border-zinc-800/80 rounded-t-3xl pt-4 pb-6 px-5 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-300">
            <div className="max-w-md mx-auto">
              {/* Grab handle */}
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />

              {/* ETA bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span className="font-medium">
                    {eta != null && eta <= 2 ? t("arrivingNow") : t("djEnRoute")}
                  </span>
                  <span className="tabular-nums">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Status pill */}
              <div className="flex justify-center mb-5">
                <div className="bg-green-500/15 text-green-400 px-4 py-1.5 rounded-full font-semibold flex items-center gap-2 border border-green-500/30 text-xs">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-green-400" />
                  </span>
                  {eta != null && eta <= 2
                    ? t("arrivingNow")
                    : t("enRouteMin").replace("{n}", eta ?? ARRIVAL_SIM_SECONDS)}
                </div>
              </div>

              {/* Driver card */}
              <div className="flex gap-4 mb-5 items-center">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-zinc-700 shrink-0 bg-zinc-800 shadow-lg">
                  <img
                    src={foundDJ.image || "/api/placeholder/150/150"}
                    alt={foundDJ.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/api/placeholder/150/150";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white truncate leading-tight">
                    {foundDJ.name}
                  </h2>
                  <div className="flex items-center gap-3 text-zinc-400 text-xs mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {djLocation ? t("tracking") : t("enRoute")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {foundDJ.rating || "4.9"}
                    </span>
                  </div>
                </div>
                <button
                  aria-label="Call DJ"
                  className="w-11 h-11 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors shadow-lg shadow-green-500/20 active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-zinc-900/70 rounded-2xl p-3.5 border border-zinc-800/80">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                    {t("estimatedArrival")}
                  </p>
                  <p className="text-white font-bold flex items-center gap-1.5 text-sm">
                    <Clock className="w-3.5 h-3.5 text-green-500" />
                    {eta ?? ARRIVAL_SIM_SECONDS} {t("mins")}
                  </p>
                </div>
                <div className="bg-zinc-900/70 rounded-2xl p-3.5 border border-zinc-800/80">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                    {t("emergencyRate")}
                  </p>
                  <p className="text-white font-bold text-base">
                    R{foundDJ.emergency_rate || 1500}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleConfirmDispatch}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.99]"
                >
                  <Navigation className="w-4 h-4" />
                  {t("viewBookingDetails")}
                </button>
                <button
                  onClick={handleCancelClick}
                  className="w-full text-zinc-500 hover:text-white text-sm font-medium transition py-2 rounded-lg hover:bg-white/5"
                >
                  {t("cancelRequest")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Completed */}
        {status === "completed" && (
          <div className="pointer-events-auto bg-zinc-950/98 backdrop-blur-2xl border-t border-green-500/20 rounded-t-3xl pt-6 pb-8 px-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{t("emergencyCompleted")}</h2>
              <p className="text-zinc-400 text-sm">{t("emergencyCompletedBody")}</p>
              <p className="text-green-400 text-xs mt-3">{t("redirectingToHistory")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Cancel confirmation sheet */}
      {showCancelConfirmSheet && (
        <ConfirmSheet
          title={t("cancelRequestTitle")}
          body={t("cancelRequestBody")}
          confirmLabel={t("yesCancel")}
          cancelLabel={t("keepRequest")}
          onConfirm={() => {
            setShowCancelConfirm(false);
            doCancelEmergency();
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  );
}