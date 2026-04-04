<template>
  <div class="space-y-2.5">
    <!-- 検索 -->
    <div class="relative">
      <svg class="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/>
      </svg>
      <input
        :value="searchQuery"
        type="text"
        placeholder="スポット名を検索..."
        class="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-8 py-1.5 text-sm placeholder:text-slate-400 transition-all duration-150 focus:border-[#B8E0C4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8EDD4]"
        @input="onSearchInput"
      />
      <button
        v-if="searchQuery"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        @click="$emit('update:searchQuery', '')"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
        </svg>
      </button>
    </div>

    <!-- ソート -->
    <div class="relative">
      <select
        :value="sortValue"
        class="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 pr-8 text-sm text-slate-700 transition-all duration-150 focus:border-[#B8E0C4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8EDD4]"
        @change="onSortChange"
      >
        <option value="visited_at:desc">訪問日（新しい順）</option>
        <option value="visited_at:asc">訪問日（古い順）</option>
        <option value="created_at:desc">登録日（新しい順）</option>
        <option value="created_at:asc">登録日（古い順）</option>
      </select>
      <svg class="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>
      </svg>
    </div>

    <!-- カテゴリフィルター -->
    <div v-if="categories.length > 0" class="flex flex-wrap gap-1.5">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150"
        :class="isSelected(cat.id)
          ? 'border-transparent text-white shadow-sm scale-105'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-sm'"
        :style="isSelected(cat.id) ? { backgroundColor: cat.color } : {}"
        @click="$emit('toggle:category', cat.id)"
      >
        <span
          v-if="!isSelected(cat.id)"
          class="h-2 w-2 rounded-full"
          :style="{ backgroundColor: cat.color }"
        />
        {{ cat.name }}
        <span class="opacity-70">({{ cat.spotCount }})</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Category } from "~/types/category";
import type { SortField, SortOrder } from "~/composables/useSpotFilter";

const props = defineProps<{
  searchQuery: string;
  selectedCategories: string[];
  sortField: SortField;
  sortOrder: SortOrder;
  categories: Category[];
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  "update:sort": [field: SortField, order: SortOrder];
  "toggle:category": [id: string];
}>();

const sortValue = computed(() => `${props.sortField}:${props.sortOrder}`);

function isSelected(id: string): boolean {
  return props.selectedCategories.includes(id);
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
function onSearchInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    emit("update:searchQuery", value);
  }, 300);
}

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

function onSortChange(e: Event) {
  const parts = (e.target as HTMLSelectElement).value.split(":");
  if (parts.length !== 2) return;
  const [field, order] = parts as [SortField, SortOrder];
  emit("update:sort", field, order);
}
</script>
