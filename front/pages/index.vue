<template>
  <SpotPanel />
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
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const markersData = useMarkers();
const markers = computed(() => [...markersData.markers.value]);
const categoriesData = useCategories();
const categories = computed(() => [...categoriesData.categories.value]);

onMounted(() => {
  markersData.fetchMarkers();
  categoriesData.fetchCategories();
});
</script>
