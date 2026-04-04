<template>
  <SpotPanel ref="spotPanel" @select-spot="selectedSpot = $event" />
  <div class="flex-1">
    <ClientOnly>
      <MapView :markers="markers" :categories="categories" />
      <template #fallback>
        <div class="w-full h-full flex items-center justify-center bg-zinc-100">
          <p class="text-zinc-500">地図を読み込み中...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
  <SpotDetailDrawer
    :spot="selectedSpot"
    @close="selectedSpot = null"
    @edit="spotPanel?.openEdit()"
    @delete="spotPanel?.openDelete()"
  />
</template>

<script setup lang="ts">
import type { Spot } from "~/types/spot";

definePageMeta({ middleware: "auth" });

const markersData = useMarkers();
const markers = computed(() => [...markersData.markers.value]);
const categoriesData = useCategories();
const categories = computed(() => [...categoriesData.categories.value]);

const selectedSpot = ref<Spot | null>(null);
const spotPanel = ref<{ openEdit: () => void; openDelete: () => void } | null>(null);

onMounted(() => {
  markersData.fetchMarkers();
  categoriesData.fetchCategories();
});
</script>
