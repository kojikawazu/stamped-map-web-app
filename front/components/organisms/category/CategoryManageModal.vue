<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="close"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl modal-enter">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-800">カテゴリ管理</h2>
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

        <!-- カテゴリ一覧 -->
        <ul class="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          <li
            v-for="cat in categories"
            :key="cat.id"
            class="flex items-center gap-3 py-2.5"
          >
            <!-- 編集モード -->
            <template v-if="editingId === cat.id">
              <input
                v-model="editForm.color"
                type="color"
                class="h-7 w-9 cursor-pointer rounded border border-slate-200 p-0.5"
              />
              <input
                v-model="editForm.name"
                type="text"
                maxlength="50"
                class="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-[#B8E0C4] focus:outline-none focus:ring-2 focus:ring-[#C8EDD4]"
              />
              <button
                type="button"
                :disabled="editLoading"
                class="rounded-lg bg-[#4CAF6F] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#388E54] disabled:opacity-50 transition-colors"
                @click="saveEdit(cat.id)"
              >
                {{ editLoading ? "..." : "保存" }}
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                @click="cancelEdit"
              >
                取消
              </button>
            </template>

            <!-- 表示モード -->
            <template v-else>
              <span
                class="h-4 w-4 shrink-0 rounded-full"
                :style="{ backgroundColor: cat.color }"
              />
              <span class="flex-1 text-sm text-slate-800">{{ cat.name }}</span>
              <span class="text-xs text-slate-400">{{ cat.spotCount }}件</span>
              <button
                type="button"
                class="text-xs text-slate-500 hover:text-slate-900 px-1 transition-colors"
                @click="startEdit(cat)"
              >
                編集
              </button>
              <button
                type="button"
                :disabled="cat.isDefault"
                class="text-xs text-rose-500 hover:text-rose-700 px-1 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                :title="cat.isDefault ? 'デフォルトカテゴリは削除できません' : ''"
                @click="requestDelete(cat)"
              >
                削除
              </button>
            </template>
          </li>
        </ul>

        <p v-if="editError" class="mt-2 text-xs text-rose-500">{{ editError }}</p>

        <div class="mt-4 flex justify-end">
          <button
            type="button"
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            @click="close"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 削除確認ダイアログ -->
  <ConfirmDialog
    v-model="showDeleteConfirm"
    title="カテゴリを削除"
    :message="`「${deletingCategory?.name}」を削除しますか？\nスポットが紐づいているカテゴリは削除できません。`"
    confirm-label="削除"
    loading-label="削除中..."
    :loading="deleteLoading"
    @confirm="confirmDelete"
  />
</template>

<script setup lang="ts">
import type { Category } from "~/types/category";

defineProps<{
  modelValue: boolean;
  categories: Category[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  updated: [];
}>();

const { updateCategory, deleteCategory, editLoading, deleteLoading, editError, clearEditError } = useCategoryManage();

const editingId = ref<string | null>(null);
const editForm = reactive({ name: "", color: "" });

const showDeleteConfirm = ref(false);
const deletingCategory = ref<Category | null>(null);

function close() {
  cancelEdit();
  emit("update:modelValue", false);
}

function startEdit(cat: Category) {
  editingId.value = cat.id;
  editForm.name = cat.name;
  editForm.color = cat.color;
  clearEditError();
}

function cancelEdit() {
  editingId.value = null;
}

async function saveEdit(id: string) {
  const result = await updateCategory(id, { name: editForm.name, color: editForm.color });
  if (result) {
    editingId.value = null;
    emit("updated");
  }
}

function requestDelete(cat: Category) {
  deletingCategory.value = cat;
  showDeleteConfirm.value = true;
}

async function confirmDelete() {
  if (!deletingCategory.value) return;
  const ok = await deleteCategory(deletingCategory.value.id);
  if (ok) {
    showDeleteConfirm.value = false;
    deletingCategory.value = null;
    emit("updated");
  }
}
</script>
