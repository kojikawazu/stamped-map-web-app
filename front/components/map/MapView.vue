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
import { escapeHtml, buildCategoryMap, markersToGeoJSON } from "~/lib/map-utils";

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

const mapContainerRef = ref<HTMLDivElement | null>(null);
const mapRef = ref<maplibregl.Map | null>(null);

function addSpotLayers(map: maplibregl.Map) {
  // クラスター円
  map.addLayer({
    id: "spots-cluster",
    type: "circle",
    source: "spots",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#6366f1", // 1〜9件: インディゴ
        10,
        "#f59e0b", // 10〜29件: アンバー
        30,
        "#ef4444", // 30件以上: レッド
      ],
      "circle-radius": [
        "step",
        ["get", "point_count"],
        20, // 1〜9件
        10,
        26, // 10〜29件
        30,
        32, // 30件以上
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.85,
    },
  });

  // クラスター件数ラベル
  map.addLayer({
    id: "spots-cluster-count",
    type: "symbol",
    source: "spots",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Open Sans Bold"],
      "text-size": 13,
    },
    paint: {
      "text-color": "#ffffff",
    },
  });

  // 個別スポット円（クラスター未参加のみ）
  map.addLayer({
    id: "spots-circle",
    type: "circle",
    source: "spots",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": 7,
      "circle-color": ["get", "color"],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  });

  // クラスタークリック → ズームイン
  map.on("click", "spots-cluster", (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ["spots-cluster"] });
    const clusterId = features[0]?.properties?.cluster_id as number | undefined;
    if (clusterId == null) return;

    const source = map.getSource("spots") as maplibregl.GeoJSONSource;
    const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
    source.getClusterExpansionZoom(clusterId).then((zoom) => {
      if (zoom == null) return;
      map.easeTo({ center: coords, zoom });
    }).catch(() => {});
  });

  map.on("mouseenter", "spots-cluster", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "spots-cluster", () => {
    map.getCanvas().style.cursor = "";
  });

  // 個別スポットクリック → ポップアップ
  map.on("click", "spots-circle", (e) => {
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== "Point") return;
    const p = feature.properties;
    if (!p) return;
    const name: string = p.name ?? "";
    const categoryName: string = p.categoryName ?? "";
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
}

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
      cluster: true,
      clusterMaxZoom: 14, // ズーム14以上では個別表示
      clusterRadius: 50,  // クラスタリング半径（px）
    });

    addSpotLayers(map);
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
