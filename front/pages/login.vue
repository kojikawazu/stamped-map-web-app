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

      <form
        class="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
        @submit.prevent="handleSubmit"
      >
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
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

definePageMeta({ layout: "empty" });

const { session, isLoading, login } = useAuth();

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

async function handleSubmit() {
  errorMessage.value = "";
  submitting.value = true;

  const result = await login(email.value, password.value);

  if (result.error) {
    errorMessage.value = result.error;
    toast.error(result.error);
    submitting.value = false;
    return;
  }

  // セッション確立後、watch が navigateTo('/') を呼ぶ
  toast.success("ログインしました");
}
</script>
