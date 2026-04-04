<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="emit('update:modelValue', false)"
    >
      <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 class="text-base font-semibold text-zinc-900">{{ title }}</h2>
        <p class="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{{ message }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            :disabled="loading"
            class="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
            @click="emit('update:modelValue', false)"
          >
            キャンセル
          </button>
          <button
            type="button"
            :disabled="loading"
            class="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            @click="emit('confirm')"
          >
            {{ loading ? loadingLabel : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loadingLabel?: string;
  loading?: boolean;
}>(), {
  confirmLabel: "確認",
  loadingLabel: "処理中...",
  loading: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();
</script>
