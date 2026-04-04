<template>
  <div class="space-y-3">
    <!-- 検索 -->
    <div class="relative">
      <input
        :value="searchQuery"
        type="text"
        placeholder="スポット名を検索..."
        class="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
        @input="onSearchInput"
      />
      <button
        v-if="searchQuery"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
        @click="$emit('update:searchQuery', '')"
      >
        <span class="text-xs">&#x2715;</span>
      </button>
    </div>

    <!-- ソート -->
    <select
      :value="sortValue"
      class="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none"
      @change="onSortChange"
    >
      <option value="visited_at:desc">訪問日（新しい順）</option>
      <option value="visited_at:asc">訪問日（古い順）</option>
      <option value="created_at:desc">登録日（新しい順）</option>
      <option value="created_at:asc">登録日（古い順）</option>
    </select>

    <!-- カテゴリフィルター -->
    <div v-if="categories.length > 0" class="flex flex-wrap gap-1.5">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors"
        :class="isSelected(cat.id) ? 'border-transparent text-white' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'"
        :style="isSelected(cat.id) ? { backgroundColor: cat.color } : {}"
        @click="$emit('toggle:category', cat.id)"
      >
        <span
          v-if="!isSelected(cat.id)"
          class="h-2 w-2 rounded-full"
          :style="{ backgroundColor: cat.color }"
        />
        {{ cat.name }}
        <span class="text-[10px] opacity-70">({{ cat.spotCount }})</span>
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
