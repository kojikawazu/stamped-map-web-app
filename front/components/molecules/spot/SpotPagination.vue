<template>
  <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between border-t border-slate-200 px-3 py-2 bg-white">
    <span class="text-xs text-slate-400">{{ pagination.total }}件</span>
    <div class="flex items-center gap-1">
      <button
        :disabled="currentPage <= 1"
        class="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        @click="$emit('update:page', currentPage - 1)"
      >
        前へ
      </button>
      <span class="px-2 text-xs text-slate-500 font-medium">
        {{ currentPage }} / {{ pagination.totalPages }}
      </span>
      <button
        :disabled="currentPage >= pagination.totalPages"
        class="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        @click="$emit('update:page', currentPage + 1)"
      >
        次へ
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pagination } from "~/types/spot";

defineProps<{
  pagination: Pagination | null;
  currentPage: number;
}>();

defineEmits<{
  "update:page": [page: number];
}>();
</script>
