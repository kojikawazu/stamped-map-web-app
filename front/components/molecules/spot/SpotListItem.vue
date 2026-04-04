<template>
  <li
    class="group flex items-start gap-0 rounded-xl border border-slate-200 bg-white shadow-sm cursor-pointer overflow-hidden transition-all duration-150 hover:shadow-md hover:border-[#B8E0C4]"
    :class="selected ? 'ring-2 ring-[#4CAF6F] border-[#4CAF6F] bg-[#E8F5EC]' : ''"
    @click="emit('select', spot)"
  >
    <!-- カテゴリカラーボーダー -->
    <span
      class="w-1 self-stretch shrink-0 rounded-l-xl"
      :style="{ backgroundColor: spot.category.color }"
    />

    <div class="min-w-0 flex-1 px-3 py-2.5">
      <p class="truncate text-sm font-semibold text-slate-800 group-hover:text-[#2A6038] transition-colors duration-150">{{ spot.name }}</p>
      <div class="mt-1 flex items-center gap-2">
        <span
          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          :style="{ backgroundColor: spot.category.color + '22', color: spot.category.color }"
        >
          {{ spot.category.name }}
        </span>
        <span class="text-xs text-slate-400">📅 {{ formatDate(spot.visitedAt) }}</span>
      </div>
    </div>

    <!-- 選択インジケーター -->
    <div class="flex items-center pr-3 self-center">
      <svg
        class="h-4 w-4 text-[#4CAF6F] opacity-0 transition-opacity duration-150"
        :class="selected ? 'opacity-100' : 'group-hover:opacity-50'"
        viewBox="0 0 20 20" fill="currentColor"
      >
        <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/>
      </svg>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { Spot } from "~/types/spot";

defineProps<{ spot: Spot; selected?: boolean }>();

const emit = defineEmits<{ select: [spot: Spot] }>();

function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, "/");
}
</script>
