"use client";
import { useEffect, useRef } from "react";

interface Props {
  carrierPos: { lat: number; lng: number; speed: number };
  routeCoords: [number, number][];
  routeProgress: number;
}

export default function TrackingMap({ carrierPos, routeCoords, routeProgress }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const carrierMarkerRef = useRef<any>(null);
  const polylineDoneRef = useRef<any>(null);
  const polylineRemainRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    
    // Dynamic import Leaflet
    const L = require("leaflet");
    require("leaflet/dist/leaflet.css");

    // Fix default icon issue
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    if (!mapInstanceRef.current) {
      // Initialize Map
      const center: [number, number] = routeCoords[0] || [17.385, 78.4867];
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, 7);

      // Dark Mode Tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© CartoDB",
      }).addTo(mapInstanceRef.current);

      // Icons
      const truckIcon = L.divIcon({
        html: `<div style="background:#2563EB;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 0 12px rgba(37,99,235,0.6);font-size:16px;">🚚</div>`,
        className: "",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const pinIcon = (color: string, emoji: string) => L.divIcon({
        html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;font-size:14px;">${emoji}</div>`,
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      // Markers
      if (routeCoords.length > 0) {
        L.marker(routeCoords[0], { icon: pinIcon("#16a34a", "📍") }).addTo(mapInstanceRef.current);
        L.marker(routeCoords[routeCoords.length - 1], { icon: pinIcon("#dc2626", "🏁") }).addTo(mapInstanceRef.current);
      }

      carrierMarkerRef.current = L.marker([carrierPos.lat || center[0], carrierPos.lng || center[1]], { icon: truckIcon }).addTo(mapInstanceRef.current);

      // Polylines
      polylineDoneRef.current = L.polyline([], { color: "#2563EB", weight: 4, opacity: 0.9 }).addTo(mapInstanceRef.current);
      polylineRemainRef.current = L.polyline(routeCoords, { color: "#64748b", weight: 3, opacity: 0.6, dashArray: "8 6" }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Dynamic Elements
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Update Carrier Position
    if (carrierPos.lat !== 0 && carrierMarkerRef.current) {
      carrierMarkerRef.current.setLatLng([carrierPos.lat, carrierPos.lng]);
      mapInstanceRef.current.setView([carrierPos.lat, carrierPos.lng], mapInstanceRef.current.getZoom(), { animate: true });
    }

    // Update Polylines based on progress
    const splitIdx = Math.round((routeProgress / 100) * routeCoords.length);
    const donePath = routeCoords.slice(0, Math.max(splitIdx, 1));
    const remainPath = routeCoords.slice(Math.max(splitIdx - 1, 0));

    if (polylineDoneRef.current) polylineDoneRef.current.setLatLngs(donePath);
    if (polylineRemainRef.current) polylineRemainRef.current.setLatLngs(remainPath);

  }, [carrierPos, routeProgress, routeCoords]);

  return (
    <div 
      ref={mapRef} 
      className="w-full bg-slate-900 border border-slate-800"
      style={{ height: "280px", borderRadius: "16px", overflow: "hidden" }} 
    />
  );
}
