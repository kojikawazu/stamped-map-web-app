<template>
  <div class="flex-1 overflow-y-auto">
    <div v-if="loading" class="space-y-2 p-3">
      <div v-for="i in 5" :key="i" class="h-16 animate-pulse rounded-xl bg-slate-100" />
    </div>
    <div v-else-if="error" class="p-6 text-center">
      <p class="text-sm text-rose-500">{{ error }}</p>
    </div>
    <div v-else-if="spots.length === 0" class="flex flex-col items-center justify-center p-8 text-center">
      <span class="mb-2 text-3xl">📍</span>
      <p class="text-sm font-medium text-slate-500">スポットが見つかりませんでした</p>
      <p class="mt-1 text-xs text-slate-400">条件を変えて再検索してください</p>
    </div>
    <ul v-else class="space-y-2 p-3">
      <SpotListItem
        v-for="spot in spots"
        :key="spot.id"
        :spot="spot"
        :selected="selectedSpotId === spot.id"
        @select="emit('select', $event)"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Spot } from "~/types/spot";

defineProps<{
  spots: Spot[];
  loading: boolean;
  error: string | null;
  selectedSpotId?: string | null;
}>();

const emit = defineEmits<{ select: [spot: Spot] }>();
</script>
