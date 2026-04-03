<template>
  <li class="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-50 cursor-pointer">
    <span
      class="mt-1 h-3 w-3 shrink-0 rounded-full"
      :style="{ backgroundColor: spot.category.color }"
    />
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium text-zinc-900">{{ spot.name }}</p>
      <div class="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
        <span>{{ spot.category.name }}</span>
        <span class="text-zinc-300">|</span>
        <span>{{ formatDate(spot.visitedAt) }}</span>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { Spot } from "~/types/spot";

defineProps<{ spot: Spot }>();

function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, "/");
}
</script>
