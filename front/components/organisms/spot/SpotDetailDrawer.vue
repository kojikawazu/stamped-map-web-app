<template>
  <Transition name="drawer">
    <div
      v-if="spot"
      class="flex w-80 shrink-0 flex-col border-l bg-white shadow-lg"
    >
      <!-- ヘッダー -->
      <div class="flex items-center justify-between border-b px-4 py-3">
        <h2 class="text-sm font-semibold text-zinc-900">スポット詳細</h2>
        <button
          type="button"
          class="text-zinc-400 hover:text-zinc-600"
          aria-label="閉じる"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- コンテンツ -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- カテゴリバッジ -->
        <div class="flex items-center gap-2">
          <span
            class="inline-block h-3 w-3 rounded-full"
            :style="{ backgroundColor: spot.category.color }"
          />
          <span class="text-xs text-zinc-500">{{ spot.category.name }}</span>
        </div>

        <!-- スポット名 -->
        <h3 class="text-lg font-semibold text-zinc-900 leading-snug">{{ spot.name }}</h3>

        <!-- 訪問日 -->
        <div class="flex items-center gap-2 text-sm text-zinc-600">
          <span class="text-zinc-400">📅</span>
          <span>{{ formatDate(spot.visitedAt) }}</span>
        </div>

        <!-- 座標 -->
        <div class="rounded-md bg-zinc-50 p-3 text-xs text-zinc-500 space-y-1">
          <p><span class="font-medium">緯度:</span> {{ spot.latitude }}</p>
          <p><span class="font-medium">経度:</span> {{ spot.longitude }}</p>
        </div>

        <!-- メモ -->
        <div v-if="spot.memo">
          <p class="mb-1 text-xs font-medium text-zinc-500">メモ</p>
          <p class="text-sm text-zinc-700 whitespace-pre-wrap">{{ spot.memo }}</p>
        </div>

        <!-- 作成日時 -->
        <p class="text-xs text-zinc-400">登録: {{ formatDateTime(spot.createdAt) }}</p>
      </div>

      <!-- フッターボタン -->
      <div class="border-t p-3 flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
          @click="emit('edit')"
        >
          編集
        </button>
        <button
          type="button"
          class="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          @click="emit('delete')"
        >
          削除
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { Spot } from "~/types/spot";

defineProps<{ spot: Spot | null }>();

const emit = defineEmits<{
  close: [];
  edit: [];
  delete: [];
}>();

function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, "/");
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
