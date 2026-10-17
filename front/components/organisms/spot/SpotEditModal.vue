<template>
  <Teleport to="body">
    <div
      v-if="modelValue && spot"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="close"
    >
      <div
        class="modal-enter w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-800">スポット編集</h2>
          <button
            type="button"
            class="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="閉じる"
            @click="close"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
              />
            </svg>
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <!-- スポット名 -->
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">
              スポット名 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              maxlength="100"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#B8E0C4] focus:ring-2 focus:ring-[#C8EDD4] focus:outline-none"
            />
            <p v-if="errors.name" class="mt-1 text-xs text-red-500">
              {{ errors.name }}
            </p>
          </div>

          <!-- カテゴリ -->
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">
              カテゴリ <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.categoryId"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#B8E0C4] focus:ring-2 focus:ring-[#C8EDD4] focus:outline-none"
            >
              <option value="">カテゴリを選択</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <p v-if="errors.categoryId" class="mt-1 text-xs text-red-500">
              {{ errors.categoryId }}
            </p>
          </div>

          <!-- 訪問日 -->
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">
              訪問日 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.visitedAt"
              type="date"
              :max="todayStr"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#B8E0C4] focus:ring-2 focus:ring-[#C8EDD4] focus:outline-none"
            />
            <p v-if="errors.visitedAt" class="mt-1 text-xs text-red-500">
              {{ errors.visitedAt }}
            </p>
          </div>

          <!-- 緯度・経度 -->
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="mb-1 block text-sm font-medium text-slate-700">
                緯度 <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.latitude"
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#B8E0C4] focus:ring-2 focus:ring-[#C8EDD4] focus:outline-none"
              />
              <p v-if="errors.latitude" class="mt-1 text-xs text-red-500">
                {{ errors.latitude }}
              </p>
            </div>
            <div class="flex-1">
              <label class="mb-1 block text-sm font-medium text-slate-700">
                経度 <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.longitude"
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#B8E0C4] focus:ring-2 focus:ring-[#C8EDD4] focus:outline-none"
              />
              <p v-if="errors.longitude" class="mt-1 text-xs text-red-500">
                {{ errors.longitude }}
              </p>
            </div>
          </div>

          <!-- メモ -->
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700"
              >メモ</label
            >
            <textarea
              v-model="form.memo"
              rows="3"
              maxlength="1000"
              class="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#B8E0C4] focus:ring-2 focus:ring-[#C8EDD4] focus:outline-none"
            />
            <p v-if="errors.memo" class="mt-1 text-xs text-red-500">
              {{ errors.memo }}
            </p>
          </div>

          <p v-if="updateError" class="text-sm text-red-500">
            {{ updateError }}
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              @click="close"
            >
              キャンセル
            </button>
            <button
              type="submit"
              :disabled="updateLoading"
              class="rounded-xl bg-[#4CAF6F] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-[#388E54] disabled:opacity-50"
            >
              {{ updateLoading ? "更新中..." : "更新" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { updateSpotSchema } from "~/schemas/spot";
import type { Category } from "~/types/category";
import type { Spot } from "~/types/spot";

const props = defineProps<{
  /** モーダルの開閉状態。`v-model` で双方向バインドする */
  modelValue: boolean;
  /** 編集対象のスポット。未選択の間は `null` でフォームを初期化しない */
  spot: Spot | null;
  /** カテゴリ選択肢 */
  categories: Category[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  updated: [spot: Spot];
}>();

const { form, errors, todayStr, reset, validate } =
  useSpotForm(updateSpotSchema);

const {
  updateSpot,
  loading: updateLoading,
  error: updateError,
} = useSpotEdit();

// スポットが変わったらフォームを初期化
watch(
  () => props.spot,
  (spot) => {
    if (spot) {
      reset({
        name: spot.name,
        categoryId: spot.category.id,
        visitedAt: spot.visitedAt,
        latitude: spot.latitude,
        longitude: spot.longitude,
        memo: spot.memo ?? "",
      });
    }
  },
  { immediate: true },
);

function close() {
  emit("update:modelValue", false);
}

async function submit() {
  if (!props.spot) return;
  const input = validate();
  if (!input) return;

  const updated = await updateSpot(props.spot.id, input);
  if (updated) {
    emit("updated", updated);
    close();
  }
}
</script>
