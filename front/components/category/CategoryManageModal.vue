<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="close"
    >
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">カテゴリ管理</h2>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
            @click="close"
          >
            ✕
          </button>
        </div>

        <!-- カテゴリ一覧 -->
        <ul class="divide-y max-h-72 overflow-y-auto">
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
                class="h-7 w-9 cursor-pointer rounded border border-gray-300 p-0.5"
              />
              <input
                v-model="editForm.name"
                type="text"
                maxlength="50"
                class="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                :disabled="editLoading"
                class="rounded-md bg-blue-600 px-2.5 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                @click="saveEdit(cat.id)"
              >
                {{ editLoading ? "..." : "保存" }}
              </button>
              <button
                type="button"
                class="rounded-md border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-50"
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
              <span class="flex-1 text-sm text-zinc-800">{{ cat.name }}</span>
              <span class="text-xs text-zinc-400">{{ cat.spotCount }}件</span>
              <button
                type="button"
                class="text-xs text-zinc-500 hover:text-zinc-900 px-1"
                @click="startEdit(cat)"
              >
                編集
              </button>
              <button
                type="button"
                :disabled="cat.isDefault"
                class="text-xs text-red-500 hover:text-red-700 px-1 disabled:text-zinc-300 disabled:cursor-not-allowed"
                :title="cat.isDefault ? 'デフォルトカテゴリは削除できません' : ''"
                @click="requestDelete(cat)"
              >
                削除
              </button>
            </template>
          </li>
        </ul>

        <p v-if="editError" class="mt-2 text-xs text-red-500">{{ editError }}</p>

        <div class="mt-4 flex justify-end">
          <button
            type="button"
            class="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
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
