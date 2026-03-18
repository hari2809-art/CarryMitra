"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

const truckIcon = typeof window !== "undefined" ? L.divIcon({
  html: `<div style="
    background:#2563EB;width:34px;height:34px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    border:3px solid white;box-shadow:0 0 12px rgba(37,99,235,0.6);
    font-size:16px;">🚚</div>`,
  className: "",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
}) : undefined;

const pinIcon = (color: string, emoji: string) => typeof window !== "undefined" ? L.divIcon({
  html: `<div style="
    background:${color};width:30px;height:30px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    border:2px solid white;font-size:14px;">
    ${emoji}</div>`,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
}) : ({} as L.DivIcon);

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

interface Props {
  carrierPos: { lat: number; lng: number; speed: number };
  routeCoords: [number, number][];
  routeProgress: number;
}

export default function TrackingMap({ carrierPos, routeCoords, routeProgress }: Props) {
  const splitIdx = Math.round((routeProgress / 100) * routeCoords.length);
  const donePath = routeCoords.slice(0, Math.max(splitIdx, 1));
  const remainPath = routeCoords.slice(Math.max(splitIdx - 1, 0));

  return (
    <MapContainer
      center={routeCoords[0] || [17.385, 78.4867]}
      zoom={7}
      style={{ height: "280px", borderRadius: "16px" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="© CartoDB"
      />

      {/* Completed path - solid blue */}
      {donePath.length > 1 && (
        <Polyline positions={donePath} color="#2563EB" weight={4} opacity={0.9} />
      )}
      {/* Remaining path - dashed gray */}
      {remainPath.length > 1 && (
        <Polyline positions={remainPath} color="#64748b" weight={3} opacity={0.6} dashArray="8 6" />
      )}

      {/* Pickup marker */}
      {routeCoords[0] && (
        <Marker position={routeCoords[0]} icon={pinIcon("#16a34a", "📍")} />
      )}

      {/* Drop marker */}
      {routeCoords[routeCoords.length - 1] && (
        <Marker position={routeCoords[routeCoords.length - 1]} icon={pinIcon("#dc2626", "🏁")} />
      )}

      {/* Carrier truck marker */}
      {carrierPos.lat !== 0 && (
        <Marker position={[carrierPos.lat, carrierPos.lng]} icon={truckIcon} />
      )}

      <MapCenter center={carrierPos.lat ? [carrierPos.lat, carrierPos.lng] : routeCoords[0] || [17.385, 78.4867]} />
    </MapContainer>
  );
}
