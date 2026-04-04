<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="close"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl modal-enter">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-800">スポット登録</h2>
          <button
            type="button"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="閉じる"
            @click="close"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
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
              placeholder="例：渋谷スクランブル交差点"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#B8E0C4] focus:outline-none focus:ring-2 focus:ring-[#C8EDD4]"
            />
            <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
          </div>

          <!-- カテゴリ -->
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">
              カテゴリ <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.categoryId"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#B8E0C4] focus:outline-none focus:ring-2 focus:ring-[#C8EDD4]"
              @change="onCategoryChange"
            >
              <option value="">カテゴリを選択</option>
              <option
                v-for="cat in localCategories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }}
              </option>
              <option value="__new__">＋ 新しいカテゴリを追加</option>
            </select>
            <p v-if="errors.categoryId" class="mt-1 text-xs text-red-500">{{ errors.categoryId }}</p>

            <!-- インラインカテゴリ追加フォーム -->
            <div v-if="showNewCategory" class="mt-2 rounded-xl border border-[#B8E0C4] bg-[#E8F5EC] p-3 space-y-2">
              <p class="text-xs font-medium text-[#2A6038]">新しいカテゴリ</p>
              <div class="flex gap-2">
                <input
                  v-model="newCategory.name"
                  type="text"
                  maxlength="50"
                  placeholder="カテゴリ名"
                  class="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-[#B8E0C4] focus:outline-none focus:ring-2 focus:ring-[#C8EDD4]"
                />
                <div class="flex items-center gap-1">
                  <input
                    v-model="newCategory.color"
                    type="color"
                    class="h-8 w-10 cursor-pointer rounded border border-slate-300 p-0.5"
                  />
                  <span class="text-xs text-gray-500">{{ newCategory.color }}</span>
                </div>
              </div>
              <p v-if="newCategoryError" class="text-xs text-red-500">{{ newCategoryError }}</p>
              <div class="flex gap-2">
                <button
                  type="button"
                  :disabled="addingCategory"
                  class="rounded-lg bg-[#4CAF6F] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#388E54] disabled:opacity-50 transition-colors"
                  @click="addCategory"
                >
                  {{ addingCategory ? "追加中..." : "追加" }}
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  @click="cancelNewCategory"
                >
                  キャンセル
                </button>
              </div>
            </div>
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
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#B8E0C4] focus:outline-none focus:ring-2 focus:ring-[#C8EDD4]"
            />
            <p v-if="errors.visitedAt" class="mt-1 text-xs text-red-500">{{ errors.visitedAt }}</p>
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
                placeholder="例：35.6812"
                class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#B8E0C4] focus:outline-none focus:ring-2 focus:ring-[#C8EDD4]"
              />
              <p v-if="errors.latitude" class="mt-1 text-xs text-red-500">{{ errors.latitude }}</p>
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
                placeholder="例：139.7671"
                class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#B8E0C4] focus:outline-none focus:ring-2 focus:ring-[#C8EDD4]"
              />
              <p v-if="errors.longitude" class="mt-1 text-xs text-red-500">{{ errors.longitude }}</p>
            </div>
          </div>

          <!-- メモ -->
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">メモ</label>
            <textarea
              v-model="form.memo"
              rows="3"
              maxlength="1000"
              placeholder="任意のメモを入力"
              class="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#B8E0C4] focus:outline-none focus:ring-2 focus:ring-[#C8EDD4]"
            />
            <p v-if="errors.memo" class="mt-1 text-xs text-red-500">{{ errors.memo }}</p>
          </div>

          <!-- エラー全体 -->
          <p v-if="createError" class="text-sm text-red-500">{{ createError }}</p>

          <!-- ボタン -->
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              @click="close"
            >
              キャンセル
            </button>
            <button
              type="submit"
              :disabled="createLoading"
              class="rounded-xl bg-[#4CAF6F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#388E54] disabled:opacity-50 transition-all duration-150"
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
const { createCategory, loading: addingCategory, error: addCategoryError, clearError: clearCategoryError } = useCategoryCreate();

// カテゴリ一覧（props のコピーを保持し、追加後にローカル更新）
const localCategories = ref<Category[]>([]);
watch(
  () => props.categories,
  (cats) => { localCategories.value = [...cats]; },
  { immediate: true }
);

// インラインカテゴリ追加
const showNewCategory = ref(false);
const newCategory = reactive({ name: "", color: "#6B7280" });
const newCategoryError = computed(() => addCategoryError.value ?? "");

function onCategoryChange() {
  if (form.categoryId === "__new__") {
    form.categoryId = "";
    showNewCategory.value = true;
    newCategory.name = "";
    newCategory.color = "#6B7280";
    clearCategoryError();
  }
}

function cancelNewCategory() {
  showNewCategory.value = false;
}

async function addCategory() {
  const cat = await createCategory({ name: newCategory.name, color: newCategory.color });
  if (cat) {
    localCategories.value.push(cat);
    form.categoryId = cat.id;
    showNewCategory.value = false;
  }
}

// モーダルが開くたびにフォームをリセット
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      Object.assign(form, initialForm());
      Object.keys(errors).forEach((k) => delete errors[k]);
      showNewCategory.value = false;
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
