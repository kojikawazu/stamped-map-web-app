<template>
  <aside class="flex w-80 shrink-0 flex-col border-r bg-white">
    <div class="border-b p-3">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-700">スポット一覧</h2>
        <div class="flex items-center gap-1.5">
          <button
            class="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-50"
            @click="showCategoryManage = true"
          >
            カテゴリ管理
          </button>
          <button
            class="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
            @click="showCreateModal = true"
          >
            ＋ 登録
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
  await Promise.all([spotsData.fetchSpots(), categoriesData.fetchCategories()]);
});

// 外部から編集・削除ダイアログを開くための expose
defineExpose({
  openEdit: () => { showEditModal.value = true; },
  openDelete: () => { showDeleteConfirm.value = true; },
});
</script>
