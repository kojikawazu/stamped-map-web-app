<template>
  <Transition name="drawer">
    <div
      v-if="spot"
      class="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white shadow-xl"
    >
      <!-- カテゴリカラーヘッダー帯 -->
      <div
        class="px-4 py-3 flex items-center justify-between"
        :style="{ background: `linear-gradient(135deg, ${spot.category.color}18, ${spot.category.color}08)`, borderBottom: `2px solid ${spot.category.color}40` }"
      >
        <div class="flex items-center gap-2">
          <span
            class="inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-bold shadow-sm"
            :style="{ backgroundColor: spot.category.color }"
          >📍</span>
          <span class="text-xs font-semibold" :style="{ color: spot.category.color }">{{ spot.category.name }}</span>
        </div>
        <button
          type="button"
          class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="閉じる"
          @click="emit('close')"
        >
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
          </svg>
        </button>
      </div>

      <!-- コンテンツ -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- スポット名 -->
        <h3 class="text-xl font-bold text-slate-900 leading-snug">{{ spot.name }}</h3>

        <!-- 訪問日 -->
        <div class="flex items-center gap-2 text-sm text-slate-600">
          <span>📅</span>
          <span class="font-medium">{{ formatDate(spot.visitedAt) }}</span>
        </div>

        <!-- 座標 -->
        <div class="rounded-xl bg-slate-100 p-3 font-mono text-xs text-slate-600 space-y-1">
          <p><span class="text-slate-400">緯度</span>  {{ spot.latitude }}</p>
          <p><span class="text-slate-400">経度</span>  {{ spot.longitude }}</p>
        </div>

        <!-- メモ -->
        <div v-if="spot.memo" class="rounded-xl border border-amber-100 bg-amber-50 p-3">
          <p class="mb-1.5 text-xs font-semibold text-amber-600">📝 メモ</p>
          <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ spot.memo }}</p>
        </div>

        <!-- 作成日時 -->
        <p class="text-xs text-slate-400">登録: {{ formatDateTime(spot.createdAt) }}</p>
      </div>

      <!-- フッターボタン（オーナーのみ表示） -->
      <div v-if="isOwner" class="border-t border-slate-200 p-3 flex gap-2">
        <button
          type="button"
          class="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#4CAF6F] px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-[#388E54] hover:shadow-md"
          @click="emit('edit')"
        >
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z"/>
          </svg>
          編集
        </button>
        <button
          type="button"
          class="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition-all duration-150 hover:bg-rose-50 hover:border-rose-300"
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

const { isOwner } = useIsOwner();

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
