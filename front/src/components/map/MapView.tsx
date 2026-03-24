"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

const DEFAULT_CENTER: [number, number] = [136.5, 36.5]; // 日本の中心付近
const DEFAULT_ZOOM = 5;
const LOCAL_STORAGE_CENTER_KEY = "map_center";
const LOCAL_STORAGE_ZOOM_KEY = "map_zoom";

function getSavedMapState(): { center: [number, number]; zoom: number } {
  try {
    const savedCenter = localStorage.getItem(LOCAL_STORAGE_CENTER_KEY);
    const savedZoom = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
    return {
      center: savedCenter ? JSON.parse(savedCenter) : DEFAULT_CENTER,
      zoom: savedZoom ? parseFloat(savedZoom) : DEFAULT_ZOOM,
    };
  } catch {
    return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
  }
}

function saveMapState(center: [number, number], zoom: number) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CENTER_KEY, JSON.stringify(center));
    localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, String(zoom));
  } catch {
    // localStorage unavailable
  }
}

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (!MAPTILER_KEY) {
      console.warn("NEXT_PUBLIC_MAPTILER_KEY is not set. Map will not load.");
      return;
    }

    const { center, zoom } = getSavedMapState();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
      center,
      zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("moveend", () => {
      const { lng, lat } = map.getCenter();
      saveMapState([lng, lat], map.getZoom());
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  if (!MAPTILER_KEY) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-100">
        <p className="text-zinc-400 text-sm">
          MapTiler API Key が未設定です。.env.local に NEXT_PUBLIC_MAPTILER_KEY を設定してください。
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}
