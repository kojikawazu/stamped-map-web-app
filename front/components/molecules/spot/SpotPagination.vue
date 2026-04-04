<template>
  <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between border-t px-3 py-2">
    <span class="text-xs text-zinc-400">{{ pagination.total }}件</span>
    <div class="flex items-center gap-1">
      <button
        :disabled="currentPage <= 1"
        class="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
        @click="$emit('update:page', currentPage - 1)"
      >
        前へ
      </button>
      <span class="px-2 text-xs text-zinc-500">
        {{ currentPage }} / {{ pagination.totalPages }}
      </span>
      <button
        :disabled="currentPage >= pagination.totalPages"
        class="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
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
