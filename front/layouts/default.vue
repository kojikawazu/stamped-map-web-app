<template>
  <div class="flex h-screen flex-col">
    <header class="flex items-center justify-between px-4 py-2 border-b bg-white shrink-0">
      <h1 class="text-lg font-bold">Stamped Map</h1>
      <button
        class="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        @click="handleLogout"
      >
        ログアウト
      </button>
    </header>
    <main class="flex flex-1 overflow-hidden">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

const { logout } = useAuth();

async function handleLogout() {
  try {
    await logout();
  } catch {
    toast.error("ログアウトに失敗しました。もう一度お試しください。");
  }
}
</script>
