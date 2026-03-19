"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ref as rtdbRef, onValue, set } from "firebase/database";
import { rtdb, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { DEMO_ROUTES } from "@/lib/constants";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface MapProps {
  carrierPos: { lat: number; lng: number; speed: number };
  routeCoords: [number, number][];
  routeProgress: number;
}

const MapComponent = dynamic<MapProps>(() => import("@/components/TrackingMap"), { ssr: false, loading: () => (
  <div className="w-full h-72 bg-slate-800 rounded-2xl flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
  </div>
) });

const STEPS = ["Picked Up", "In Transit", "Near Destination", "Delivered"];
const DEMO_UPDATES = [
  "📦 Parcel picked up from sender",
  "🚗 Carrier departed pickup location",
  "🛣️ On the highway",
  "🏙️ Entering city limits",
  "📍 Approaching destination",
  "✅ Delivered successfully",
];

export default function TrackingClient({ parcelId }: { parcelId: string }) {
  const router = useRouter();
  const [demoMode, setDemoMode] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [updates, setUpdates] = useState<{ time: string; text: string }[]>([
    { time: "10:30 AM", text: "📦 Parcel picked up from sender" },
    { time: "10:45 AM", text: "🚗 Carrier departed pickup location" },
  ]);
  const [carrierPos, setCarrierPos] = useState({ lat: 0, lng: 0, speed: 0 });
  const [routeKey, setRouteKey] = useState("Kadapa-Hyderabad");
  const [carrierName, setCarrierName] = useState("Deepak Kumar");
  const [routeProgress, setRouteProgress] = useState(0);
  const [lastReceived, setLastReceived] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const watchRef = useRef<number>();

  // Fetch real parcel data
  useEffect(() => {
    if (parcelId === "demo") return;
    
    const unsub = onSnapshot(doc(db, "parcels", parcelId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const route = `${data.pickupCity}-${data.deliveryCity}`;
        setRouteKey(route);
        setCarrierName(data.carrierName || "Anonymous Carrier");
      }
    });

    return () => unsub();
  }, [parcelId]);

  const carrierRoute = DEMO_ROUTES[routeKey] || DEMO_ROUTES["Kadapa-Hyderabad"];
  const routeCoords = carrierRoute as [number, number][];

  // Demo mode: animate carrier along route
  useEffect(() => {
    if (!demoMode) return;
    let idx = 0;
    if (routeCoords.length > 0) {
      setCarrierPos({ lat: routeCoords[0][0], lng: routeCoords[0][1], speed: 60 });
    }
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % routeCoords.length;
      const [lat, lng] = routeCoords[idx];
      setCarrierPos({ lat, lng, speed: Math.round(40 + Math.random() * 40) });
      setRouteProgress(Math.round((idx / (routeCoords.length - 1)) * 100));
      if (idx < STEPS.length) setCurrentStep(Math.min(idx, STEPS.length - 1));
      if (idx < DEMO_UPDATES.length && idx > 1) {
        const now = new Date();
        setUpdates((prev) => [
          { time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), text: DEMO_UPDATES[idx] },
          ...prev,
        ]);
      }
    }, 4000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, routeKey]);

  // Real GPS mode
  const startGPSTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("GPS not available");
      setGpsError("GPS not available in this browser");
      return;
    }

    setGpsError(null);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const locationData = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0, // convert m/s to km/h
          timestamp: Date.now(),
        };
        setCarrierPos({ lat: locationData.lat, lng: locationData.lng, speed: locationData.speed });
        setLastReceived(Date.now());
        try {
          if (parcelId !== "demo") {
            set(rtdbRef(rtdb, `tracking/${parcelId}`), locationData);
          }
        } catch (err) {
          console.error("RTDB error:", err);
        }
      },
      (err) => {
        let msg = "GPS error: " + err.message;
        if (err.code === 1) msg = "Please enable GPS in browser settings to use live tracking";
        setGpsError(msg);
        toast.error(msg);
        setDemoMode(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcelId]);

  // Real GPS: listen on RTDB (sender side)
  useEffect(() => {
    if (demoMode || parcelId === "demo") return;
    try {
      const trackRef = rtdbRef(rtdb, `tracking/${parcelId}`);
      const unsub = onValue(trackRef, (snap) => {
        const data = snap.val();
        if (data) {
          setCarrierPos({ lat: data.lat, lng: data.lng, speed: data.speed || 0 });
          setLastReceived(data.timestamp || Date.now());
        }
      });
      return () => unsub();
    } catch { /* rtdb not configured */ }
  }, [demoMode, parcelId]);

  useEffect(() => {
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  const eta = Math.max(0, Math.round((routeCoords.length - routeProgress / 100 * routeCoords.length) * 0.5));

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center">
          <ArrowLeftIcon className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold">Live Tracking</h1>
          <p className="text-slate-400 text-xs">#{parcelId}</p>
        </div>
        {/* Mode Toggle */}
        <div className="flex bg-slate-800 rounded-xl p-1">
          {["Demo", "GPS"].map((m) => (
            <button
              key={m}
              onClick={() => {
                const isDemo = m === "Demo";
                setDemoMode(isDemo);
                if (!isDemo) startGPSTracking();
                else if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                (m === "Demo") === demoMode
                  ? "bg-blue-600 text-white"
                  : "text-slate-400"
              }`}
            >
              {m === "Demo" ? "🎬 Demo" : "📡 GPS"}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Info Card */}
      <div className="px-4 py-3">
        <div className="glass-card px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs">📍 Carrier</p>
            <p className="text-white text-sm font-semibold">{carrierName}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs">Speed</p>
            <p className="text-blue-400 font-bold">{carrierPos.speed} km/h</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs">ETA</p>
            <p className="text-amber-400 font-bold">~{eta}h</p>
          </div>
        </div>
      </div>

      {/* GPS Status / Warnings */}
      {!demoMode && (
        <div className="px-4 mb-2">
          {gpsError ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-500 text-xs text-center">
              ⚠️ {gpsError}
            </div>
          ) : lastReceived ? (
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live GPS Connected
              </span>
              <span className="text-[10px] text-slate-400 italic">
                {Math.round((Date.now() - lastReceived) / 1000) > 60 ? (
                  <span className="text-amber-500 font-bold">⚠️ Carrier location unavailable</span>
                ) : (
                  `Last updated ${Math.max(0, Math.round((Date.now() - lastReceived) / 1000))}s ago`
                )}
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* Map */}
      <div className="px-4">
        <MapComponent
          carrierPos={carrierPos.lat ? carrierPos : { lat: routeCoords[0]?.[0] || 17.385, lng: routeCoords[0]?.[1] || 78.4867, speed: 60 }}
          routeCoords={routeCoords}
          routeProgress={routeProgress}
        />
      </div>

      {/* Progress Stepper */}
      <div className="px-4 py-3">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 font-bold
                    ${i < currentStep ? "step-done" : i === currentStep ? "step-active" : "step-pending"}`}>
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <p className={`text-[9px] mt-1 text-center w-16 ${i <= currentStep ? "text-blue-400" : "text-slate-500"}`}>
                    {step}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < currentStep ? "bg-blue-600" : "bg-slate-700"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 bg-slate-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${routeProgress}%` }}
            />
          </div>
          <p className="text-slate-400 text-xs text-center mt-1">{routeProgress}% complete</p>
        </div>
      </div>

      {/* Live Updates Feed */}
      <div className="px-4 pb-8 flex-1">
        <div className="glass-card p-4">
          <h3 className="text-white font-semibold text-sm mb-3">📡 Live Updates</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {updates.map((u, i) => (
              <div key={i} className="flex items-start gap-3 animate-fade-in">
                <span className="text-slate-500 text-[10px] flex-shrink-0 mt-0.5">{u.time}</span>
                <p className="text-slate-300 text-xs">{u.text}</p>
              </div>
            ))}
          </div>
        </div>

        {demoMode && (
          <div className="mt-3 glass-card p-3 border border-blue-600/30">
            <p className="text-blue-400 text-xs text-center">
              ℹ️ Open two browser tabs to test: Tab 1 = Carrier (GPS mode), Tab 2 = Sender (watch live)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
