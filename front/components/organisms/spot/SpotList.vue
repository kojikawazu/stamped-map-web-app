<template>
  <div class="flex-1 overflow-y-auto">
    <div v-if="loading" class="space-y-3 p-3">
      <div v-for="i in 5" :key="i" class="h-14 animate-pulse rounded-lg bg-zinc-100" />
    </div>
    <div v-else-if="error" class="p-4 text-center text-sm text-red-500">
      {{ error }}
    </div>
    <div v-else-if="spots.length === 0" class="p-4 text-center text-sm text-zinc-400">
      スポットが見つかりませんでした
    </div>
    <ul v-else class="divide-y divide-zinc-100">
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
