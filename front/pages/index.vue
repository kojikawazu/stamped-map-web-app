<template>
  <aside class="w-80 border-r bg-white p-4 overflow-y-auto shrink-0">
    <p class="text-zinc-400 text-sm">スポット一覧（実装予定）</p>
  </aside>
  <div class="flex-1">
    <ClientOnly>
      <MapView />
      <template #fallback>
        <div class="w-full h-full flex items-center justify-center bg-zinc-100">
          <p class="text-zinc-500">地図を読み込み中...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });
</script>
