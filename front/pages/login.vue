<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#E8F5EC] via-white to-slate-50 px-4">
    <div v-if="isLoading" class="flex items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-[#C8EDD4] border-t-[#4CAF6F]" />
    </div>

    <div v-else class="w-full max-w-sm">
      <!-- ロゴ -->
      <div class="mb-8 text-center">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4CAF6F] shadow-lg">
          <svg class="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-900">Stamped Map</h1>
        <p class="mt-1.5 text-sm text-slate-500">旅の記録をスタンプしよう</p>
      </div>

      <!-- カード -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl ring-1 ring-slate-900/5">
        <!-- Google ログイン -->
        <button
          type="button"
          :disabled="submitting"
          class="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          @click="handleGoogleLogin"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google でログイン
        </button>

        <!-- 区切り線 -->
        <div class="my-5 flex items-center gap-3">
          <div class="h-px flex-1 bg-slate-200" />
          <span class="text-xs text-slate-400">または</span>
          <div class="h-px flex-1 bg-slate-200" />
        </div>

        <!-- メール/パスワードログイン -->
        <form @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-slate-700">
                メールアドレス
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                :disabled="submitting"
                placeholder="mail@example.com"
                class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-[#B8E0C4] focus:outline-none focus:ring-2 focus:ring-[#C8EDD4] disabled:bg-slate-50"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-slate-700">
                パスワード
              </label>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                :disabled="submitting"
                placeholder="パスワードを入力"
                class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-[#B8E0C4] focus:outline-none focus:ring-2 focus:ring-[#C8EDD4] disabled:bg-slate-50"
              />
            </div>

            <p v-if="errorMessage" class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{{ errorMessage }}</p>

            <button
              type="submit"
              :disabled="submitting"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4CAF6F] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-[#388E54] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4CAF6F] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg v-if="submitting" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {{ submitting ? "ログイン中..." : "ログイン" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

definePageMeta({ layout: "empty" });

const { session, isLoading, login, loginWithGoogle } = useAuth();

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const submitting = ref(false);

watch(
  session,
  (s) => {
    if (s) navigateTo("/");
  },
  { immediate: true }
);

async function handleGoogleLogin() {
  submitting.value = true;
  try {
    await loginWithGoogle();
  } catch {
    toast.error("Googleログインに失敗しました");
    submitting.value = false;
  }
}

async function handleSubmit() {
  errorMessage.value = "";
  submitting.value = true;

  try {
    const result = await login(email.value, password.value);

    if (result.error) {
      errorMessage.value = result.error;
      toast.error(result.error);
      return;
    }

    toast.success("ログインしました");
  } finally {
    submitting.value = false;
  }
}
</script>
