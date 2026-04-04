<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="close"
    >
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">スポット登録</h2>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
            @click="close"
          >
            ✕
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <!-- スポット名 -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              スポット名 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              maxlength="100"
              placeholder="例：渋谷スクランブル交差点"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
          </div>

          <!-- カテゴリ -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              カテゴリ <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.categoryId"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">カテゴリを選択</option>
              <option
                v-for="cat in categories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }}
              </option>
            </select>
            <p v-if="errors.categoryId" class="mt-1 text-xs text-red-500">{{ errors.categoryId }}</p>
          </div>

          <!-- 訪問日 -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              訪問日 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.visitedAt"
              type="date"
              :max="todayStr"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p v-if="errors.visitedAt" class="mt-1 text-xs text-red-500">{{ errors.visitedAt }}</p>
          </div>

          <!-- 緯度・経度 -->
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="mb-1 block text-sm font-medium text-gray-700">
                緯度 <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.latitude"
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                placeholder="例：35.6812"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p v-if="errors.latitude" class="mt-1 text-xs text-red-500">{{ errors.latitude }}</p>
            </div>
            <div class="flex-1">
              <label class="mb-1 block text-sm font-medium text-gray-700">
                経度 <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.longitude"
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                placeholder="例：139.7671"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p v-if="errors.longitude" class="mt-1 text-xs text-red-500">{{ errors.longitude }}</p>
            </div>
          </div>

          <!-- メモ -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">メモ</label>
            <textarea
              v-model="form.memo"
              rows="3"
              maxlength="1000"
              placeholder="任意のメモを入力"
              class="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p v-if="errors.memo" class="mt-1 text-xs text-red-500">{{ errors.memo }}</p>
          </div>

          <!-- エラー全体 -->
          <p v-if="createError" class="text-sm text-red-500">{{ createError }}</p>

          <!-- ボタン -->
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              @click="close"
            >
              キャンセル
            </button>
            <button
              type="submit"
              :disabled="createLoading"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {{ createLoading ? "登録中..." : "登録" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { createSpotSchema } from "~/lib/validations/spot";
import type { Category } from "~/types/category";

const props = defineProps<{
  modelValue: boolean;
  categories: Category[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  created: [];
}>();

const todayStr = new Date().toISOString().split("T")[0];

const initialForm = () => ({
  name: "",
  categoryId: "",
  visitedAt: todayStr,
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
  memo: "",
});

const form = reactive(initialForm());
const errors = reactive<Record<string, string>>({});

const { createSpot, loading: createLoading, error: createError } = useSpotCreate();

// モーダルが開くたびにフォームをリセット
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      Object.assign(form, initialForm());
      Object.keys(errors).forEach((k) => delete errors[k]);
    }
  }
);

function close() {
  emit("update:modelValue", false);
}

async function submit() {
  // クライアントバリデーション
  Object.keys(errors).forEach((k) => delete errors[k]);
  // type="number" の空入力は v-model.number が NaN になるため、明示的にチェックする
  if (form.latitude === undefined || isNaN(form.latitude as number)) {
    errors.latitude = "緯度を入力してください";
  }
  if (form.longitude === undefined || isNaN(form.longitude as number)) {
    errors.longitude = "経度を入力してください";
  }
  if (errors.latitude || errors.longitude) return;

  const result = createSpotSchema.safeParse({
    name: form.name,
    categoryId: form.categoryId,
    visitedAt: form.visitedAt,
    latitude: form.latitude,
    longitude: form.longitude,
    memo: form.memo || undefined,
  });
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!errors[key]) errors[key] = issue.message;
    }
    return;
  }

  const spot = await createSpot(result.data);
  if (spot) {
    emit("created");
    close();
  }
}
</script>
