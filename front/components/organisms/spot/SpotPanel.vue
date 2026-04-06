<template>
  <aside class="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
    <div class="border-b border-slate-200 bg-white px-3 pt-3 pb-2 shadow-sm">
      <div class="mb-2.5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-bold text-slate-800">スポット一覧</h2>
          <span
            v-if="spots.length > 0"
            class="rounded-full bg-[#C8EDD4] px-2 py-0.5 text-xs font-semibold text-[#1E6040]"
          >{{ pagination?.total ?? spots.length }}</span>
        </div>
        <div v-if="isOwner" class="flex items-center gap-1.5">
          <button
            class="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="カテゴリ管理"
            @click="showCategoryManage = true"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"/>
            </svg>
          </button>
          <button
            class="flex items-center gap-1 rounded-lg bg-[#4CAF6F] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#388E54] hover:shadow-md"
            @click="showCreateModal = true"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
            </svg>
            登録
          </button>
        </div>
      </div>
      <SpotFilter
        :search-query="searchQuery"
        :selected-categories="selectedCategories"
        :sort-field="sortField"
        :sort-order="sortOrder"
        :categories="categories"
        @update:search-query="setSearch"
        @update:sort="setSort"
        @toggle:category="toggleCategory"
      />
    </div>
    <SpotList
      :spots="spots"
      :loading="spotsLoading"
      :error="spotsError"
      :selected-spot-id="selectedSpot?.id ?? null"
      @select="onSelectSpot"
    />
    <SpotPagination
      :pagination="pagination"
      :current-page="page"
      @update:page="setPage"
    />
  </aside>

  <!-- スポット登録モーダル -->
  <SpotCreateModal
    v-model="showCreateModal"
    :categories="categories"
    @created="onSpotCreated"
  />

  <!-- スポット編集モーダル -->
  <SpotEditModal
    v-model="showEditModal"
    :spot="selectedSpot"
    :categories="categories"
    @updated="onSpotUpdated"
  />

  <!-- スポット削除確認ダイアログ -->
  <ConfirmDialog
    v-model="showDeleteConfirm"
    title="スポットを削除"
    :message="selectedSpot ? `「${selectedSpot.name}」を削除しますか？` : ''"
    confirm-label="削除"
    loading-label="削除中..."
    :loading="deleteLoading"
    @confirm="onDeleteConfirm"
  />

  <!-- カテゴリ管理モーダル -->
  <CategoryManageModal
    v-model="showCategoryManage"
    :categories="categories"
    @updated="onCategoryUpdated"
  />
</template>

<script setup lang="ts">
import type { Spot } from "~/types/spot";

const { isOwner, fetchIsOwner } = useIsOwner();

const filter = useSpotFilter();
const { setSearch, toggleCategory, setSort, setPage } = filter;
const searchQuery = computed(() => filter.searchQuery.value);
const selectedCategories = computed(() => [...filter.selectedCategories.value]);
const sortField = computed(() => filter.sortField.value);
const sortOrder = computed(() => filter.sortOrder.value);
const page = computed(() => filter.page.value);

const spotsData = useSpots();
const spots = computed(() => [...spotsData.spots.value]);
const pagination = computed(() => spotsData.pagination.value);
const spotsLoading = computed(() => spotsData.loading.value);
const spotsError = computed(() => spotsData.error.value);

const categoriesData = useCategories();
const categories = computed(() => [...categoriesData.categories.value]);

// モーダル・ドロワー表示制御
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);
const showCategoryManage = ref(false);

// 選択中スポット（詳細ドロワーに emit で連携）
const selectedSpot = ref<Spot | null>(null);
const emit = defineEmits<{
  "select-spot": [spot: Spot | null];
}>();

const { deleteSpot, loading: deleteLoading } = useSpotDelete();

function onSelectSpot(spot: Spot) {
  selectedSpot.value = spot;
  emit("select-spot", spot);
}

async function onSpotCreated() {
  await spotsData.fetchSpots();
}

function onSpotUpdated(updated: Spot) {
  // ローカルの選択中スポットを更新
  selectedSpot.value = updated;
  spotsData.fetchSpots();
}

async function onDeleteConfirm() {
  if (!selectedSpot.value) return;
  const ok = await deleteSpot(selectedSpot.value.id);
  if (ok) {
    showDeleteConfirm.value = false;
    selectedSpot.value = null;
    emit("select-spot", null);
    await spotsData.fetchSpots();
  }
}

async function onCategoryUpdated() {
  await categoriesData.fetchCategories();
}

onMounted(async () => {
  await Promise.all([spotsData.fetchSpots(), categoriesData.fetchCategories(), fetchIsOwner()]);
});

// 外部から編集・削除ダイアログを開くための expose
defineExpose({
  openEdit: () => { showEditModal.value = true; },
  openDelete: () => { showDeleteConfirm.value = true; },
});
</script>
