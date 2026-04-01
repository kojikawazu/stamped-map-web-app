<template>
  <div class="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
    <div class="text-center">
      <p class="text-5xl font-bold text-zinc-800">{{ error?.statusCode }}</p>
      <p class="mt-4 text-lg text-zinc-600">
        {{ error?.statusCode === 404 ? "ページが見つかりません" : "サーバーエラーが発生しました" }}
      </p>
      <button
        class="mt-6 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        @click="handleError"
      >
        トップへ戻る
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();

function handleError() {
  clearError({ redirect: "/" });
}
</script>
