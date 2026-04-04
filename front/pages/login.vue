<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div v-if="isLoading" class="flex items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-600" />
    </div>

    <div v-else class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold text-zinc-900">Stamped Map</h1>
        <p class="mt-2 text-sm text-zinc-500">アカウントにログインしてください</p>
      </div>

      <div class="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <!-- Google ログイン -->
        <button
          type="button"
          :disabled="submitting"
          class="flex w-full items-center justify-center gap-3 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div class="my-4 flex items-center gap-3">
          <div class="h-px flex-1 bg-zinc-200" />
          <span class="text-xs text-zinc-400">または</span>
          <div class="h-px flex-1 bg-zinc-200" />
        </div>

        <!-- メール/パスワードログイン -->
        <form @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-zinc-700">
                メールアドレス
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                :disabled="submitting"
                placeholder="mail@example.com"
                class="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-zinc-700">
                パスワード
              </label>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                :disabled="submitting"
                placeholder="パスワードを入力"
                class="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

            <button
              type="submit"
              :disabled="submitting"
              class="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
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

// 認証済みならメイン画面へリダイレクト
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
    // 成功時はブラウザが Google 同意画面へリダイレクトするため、ここには戻らない
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

    // セッション確立後、watch が navigateTo('/') を呼ぶ
    toast.success("ログインしました");
  } finally {
    // navigateTo が失敗した場合もボタンを確実にリセットする
    submitting.value = false;
  }
}
</script>
