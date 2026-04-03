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
import type { Marker } from "~/types/marker";
import type { Category } from "~/types/category";

const props = defineProps<{
  markers: Marker[];
  categories: Category[];
}>();

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildCategoryMap(cats: Category[]): Map<string, string> {
  return new Map(cats.map((c) => [c.id, c.name]));
}

function markersToGeoJSON(items: Marker[], categoryMap: Map<string, string>): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: items.map((m) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [m.longitude, m.latitude],
      },
      properties: {
        id: m.id,
        name: m.name,
        color: m.categoryColor,
        categoryName: categoryMap.get(m.categoryId) ?? "",
      },
    })),
  };
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

  map.on("load", () => {
    map.addSource("spots", {
      type: "geojson",
      data: markersToGeoJSON(props.markers, buildCategoryMap(props.categories)),
    });

    map.addLayer({
      id: "spots-circle",
      type: "circle",
      source: "spots",
      paint: {
        "circle-radius": 7,
        "circle-color": ["get", "color"],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    // ポップアップ表示
    map.on("click", "spots-circle", (e) => {
      const feature = e.features?.[0];
      if (!feature || feature.geometry.type !== "Point") return;
      const props = feature.properties;
      if (!props) return;
      const name: string = props.name ?? "";
      const categoryName: string = props.categoryName ?? "";
      new maplibregl.Popup({ offset: 10 })
        .setLngLat(feature.geometry.coordinates as [number, number])
        .setHTML(
          `<div class="text-sm">
            <p class="font-medium">${escapeHtml(name)}</p>
            <p class="text-zinc-500 text-xs">${escapeHtml(categoryName)}</p>
          </div>`
        )
        .addTo(map);
    });

    map.on("mouseenter", "spots-circle", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "spots-circle", () => {
      map.getCanvas().style.cursor = "";
    });
  });

  mapRef.value = map;
});

// markers / categories が変化したら GeoJSON ソースを更新
watch(
  () => [props.markers, props.categories],
  () => {
    const map = mapRef.value;
    if (!map) return;
    const source = map.getSource("spots") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(markersToGeoJSON(props.markers, buildCategoryMap(props.categories)));
    }
  },
  { deep: true }
);

onUnmounted(() => {
  mapRef.value?.remove();
  mapRef.value = null;
});
</script>
