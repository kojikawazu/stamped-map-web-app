<template>
  <div class="w-full h-full">
    <div
      v-if="!maptilerKey"
      class="w-full h-full flex items-center justify-center bg-zinc-100"
    >
      <p class="text-zinc-400 text-sm">
        MapTiler API Key が未設定です。.env に NUXT_PUBLIC_MAPTILER_KEY を設定してください。
      </p>
    </div>
    <div v-else ref="mapContainerRef" class="w-full h-full" style="min-height: 400px" />
  </div>
</template>

<script setup lang="ts">
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const config = useRuntimeConfig();
const maptilerKey = config.public.maptilerKey as string;

const DEFAULT_CENTER: [number, number] = [136.5, 36.5];
const DEFAULT_ZOOM = 5;
const LOCAL_STORAGE_CENTER_KEY = "map_center";
const LOCAL_STORAGE_ZOOM_KEY = "map_zoom";

function getSavedMapState() {
  try {
    const savedCenter = localStorage.getItem(LOCAL_STORAGE_CENTER_KEY);
    const savedZoom = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
    return {
      center: savedCenter
        ? (JSON.parse(savedCenter) as [number, number])
        : DEFAULT_CENTER,
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

const mapContainerRef = ref<HTMLDivElement | null>(null);
const mapRef = ref<maplibregl.Map | null>(null);

onMounted(() => {
  if (!mapContainerRef.value || mapRef.value || !maptilerKey) return;

  const { center, zoom } = getSavedMapState();

  const map = new maplibregl.Map({
    container: mapContainerRef.value,
    style: `https://api.maptiler.com/maps/streets/style.json?key=${maptilerKey}`,
    center,
    zoom,
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");

  map.on("moveend", () => {
    const { lng, lat } = map.getCenter();
    saveMapState([lng, lat], map.getZoom());
  });

  mapRef.value = map;
});

onUnmounted(() => {
  mapRef.value?.remove();
  mapRef.value = null;
});
</script>
