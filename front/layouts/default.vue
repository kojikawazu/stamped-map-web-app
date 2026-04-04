<template>
  <div class="flex h-screen flex-col">
    <header class="flex items-center justify-between px-5 py-3 shrink-0 bg-gradient-to-r from-[#4CAF6F] to-[#388E54] shadow-md">
      <div class="flex items-center gap-2">
        <svg class="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
        </svg>
        <h1 class="text-base font-bold text-white tracking-wide">Stamped Map</h1>
      </div>
      <button
        class="rounded-md px-3 py-1.5 text-sm text-white/90 hover:bg-white/20 transition-colors duration-150"
        @click="handleLogout"
      >
        ログアウト
      </button>
    </header>
    <main class="flex flex-1 overflow-hidden bg-slate-50">
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
