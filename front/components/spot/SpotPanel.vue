<template>
  <aside class="flex w-80 shrink-0 flex-col border-r bg-white">
    <div class="border-b p-3">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-700">スポット一覧</h2>
        <button
          class="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
          @click="showModal = true"
        >
          ＋ 登録
        </button>
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
    <SpotList :spots="spots" :loading="spotsLoading" :error="spotsError" />
    <SpotPagination
      :pagination="pagination"
      :current-page="page"
      @update:page="setPage"
    />
  </aside>

  <SpotCreateModal
    v-model="showModal"
    :categories="categories"
    @created="onSpotCreated"
  />
</template>

<script setup lang="ts">
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

const showModal = ref(false);

async function onSpotCreated() {
  await spotsData.fetchSpots();
}

onMounted(async () => {
  await Promise.all([spotsData.fetchSpots(), categoriesData.fetchCategories()]);
});
</script>
