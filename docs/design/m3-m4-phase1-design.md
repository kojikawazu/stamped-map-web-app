# M3/M4 フェーズ①設計書 — 地図マーカー + スポット一覧パネル

## 対象フェーズ

| フェーズ | 内容 |
|---------|------|
| ① | 地図マーカー描画（M3）+ スポット一覧パネル（M4）を並行実装 |

---

## 全体方針

- フィルター・ソート・検索の状態を **`useSpotFilter` composable** に一元管理する
- 一覧パネル（`GET /api/spots`）と地図マーカー（`GET /api/spots/markers`）は **同じフィルター状態** を参照する
- データ取得ロジックは composables に閉じ、コンポーネントはUIに専念する

---

## 状態設計

### フィルター状態（`useSpotFilter`）

```
searchQuery: string       // 名前検索
selectedCategories: string[] // カテゴリIDの配列（空=全件）
sortField: 'visited_at' | 'created_at'
sortOrder: 'asc' | 'desc'
page: number              // 現在のページ（一覧用）
```

> フィルター変更時は `page` を 1 にリセットする。

### フィルターから生成するクエリパラメータ

| API | パラメータ |
|-----|-----------|
| `GET /api/spots` | `page`, `limit=20`, `sort`, `order`, `category`(カンマ区切り), `q` |
| `GET /api/spots/markers` | `category`(カンマ区切り), `q` のみ（ページネーションなし） |

---

## Composables 設計

### `composables/useSpotFilter.ts`
フィルター状態の一元管理。

```typescript
// 提供するもの
const searchQuery = ref('')
const selectedCategories = ref<string[]>([])
const sortField = ref<'visited_at' | 'created_at'>('visited_at')
const sortOrder = ref<'asc' | 'desc'>('desc')
const page = ref(1)

// 算出プロパティ
const spotsQuery  // /api/spots 用クエリオブジェクト
const markersQuery // /api/spots/markers 用クエリオブジェクト

// メソッド
function setSearch(q: string)     // 検索変更（pageリセット）
function toggleCategory(id: string) // カテゴリ選択トグル（pageリセット）
function setSort(field, order)    // ソート変更（pageリセット）
function setPage(n: number)
function resetFilters()
```

### `composables/useSpots.ts`
スポット一覧取得（ページネーション付き）。

```typescript
// 入力
const filter = useSpotFilter()

// 提供するもの
const spots = ref<Spot[]>([])
const pagination = ref<Pagination | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function fetchSpots()  // フィルター変化を watch して自動発火
```

### `composables/useMarkers.ts`
マーカー用軽量データ取得（全件）。

```typescript
// 入力
const filter = useSpotFilter()

// 提供するもの
const markers = ref<Marker[]>([])
const loading = ref(false)

async function fetchMarkers() // フィルター変化を watch して自動発火
```

### `composables/useCategories.ts`
カテゴリ一覧取得（フィルターUI用）。

```typescript
const categories = ref<Category[]>([])
const loading = ref(false)

async function fetchCategories() // onMounted で一度だけ呼ぶ
```

---

## 型定義

`types/` ディレクトリを新設してAPIレスポンス型を定義する。

### `types/spot.ts`
```typescript
export interface SpotCategory {
  id: string
  name: string
  color: string
}

export interface Spot {
  id: string
  name: string
  category: SpotCategory
  latitude: number
  longitude: number
  visitedAt: string
  memo: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface SpotsResponse {
  data: Spot[]
  pagination: Pagination
}
```

### `types/marker.ts`
```typescript
export interface Marker {
  id: string
  name: string
  latitude: number
  longitude: number
  categoryId: string
  categoryColor: string
}

export interface MarkersResponse {
  data: Marker[]
}
```

### `types/category.ts`
```typescript
export interface Category {
  id: string
  name: string
  color: string
  isDefault: boolean
  sortOrder: number
  spotCount: number
}

export interface CategoriesResponse {
  data: Category[]
}
```

---

## コンポーネント設計

```
pages/index.vue
├── components/spot/SpotPanel.vue       # 左パネル全体（aside）
│   ├── components/spot/SpotFilter.vue  # 検索・ソート・カテゴリフィルター
│   ├── components/spot/SpotList.vue    # スポット一覧（スクロール領域）
│   │   └── components/spot/SpotListItem.vue  # スポット1件
│   └── components/spot/SpotPagination.vue    # ページネーション
└── components/map/MapView.vue          # 右パネル（地図 + マーカー）
```

### `components/spot/SpotPanel.vue`
左パネルのコンテナ。`useSpotFilter`, `useSpots`, `useCategories` を呼び出し、子コンポーネントに props で渡す。

### `components/spot/SpotFilter.vue`

```
Props: categories, searchQuery, selectedCategories, sortField, sortOrder
Emits: update:searchQuery, update:selectedCategories, update:sort
```

UI要素:
- テキスト入力（スポット名検索）
- セレクトボックス（ソート選択）
- カテゴリチェックボックス一覧（色バッジ付き）

### `components/spot/SpotList.vue`

```
Props: spots, loading, error
```

UI要素:
- ローディングスケルトン（loading=true 時）
- エラーメッセージ（error 時）
- 件数ゼロ時の空状態メッセージ
- `SpotListItem` のリスト

### `components/spot/SpotListItem.vue`

```
Props: spot (Spot 型)
```

表示内容:
- カテゴリ色のバッジ
- スポット名
- カテゴリ名
- 訪問日（YYYY-MM-DD → YYYY/MM/DD 表示）

### `components/spot/SpotPagination.vue`

```
Props: pagination (Pagination 型), currentPage
Emits: update:page
```

UI要素:
- 「前へ」「次へ」ボタン
- 現在ページ / 総ページ数表示
- 総件数表示

### `components/map/MapView.vue`（拡張）

マーカー描画を追加する。`useMarkers` は MapView 内で呼ばない。
代わりに `pages/index.vue` または `SpotPanel.vue` と同じ `useSpotFilter` を共有し、
`markers` を props で受け取る形とする。

```
Props: markers (Marker[] 型)
```

マーカー実装方針:
- MapLibre の `GeoJSON Source` + `Circle Layer` でマーカーを描画
- `categoryColor` を円の色に使用
- マーカークリック → ポップアップ（名前・カテゴリ名・訪問日）を表示
  - ※ ポップアップの詳細実装はフェーズ②以降でも可

---

## ファイル作成リスト

| ファイル | 種別 | 内容 |
|---------|------|------|
| `types/spot.ts` | 新規 | Spot / Pagination / SpotsResponse 型 |
| `types/marker.ts` | 新規 | Marker / MarkersResponse 型 |
| `types/category.ts` | 新規 | Category / CategoriesResponse 型 |
| `composables/useSpotFilter.ts` | 新規 | フィルター状態一元管理 |
| `composables/useSpots.ts` | 新規 | スポット一覧取得 |
| `composables/useMarkers.ts` | 新規 | マーカーデータ取得 |
| `composables/useCategories.ts` | 新規 | カテゴリ一覧取得 |
| `components/spot/SpotPanel.vue` | 新規 | 左パネルコンテナ |
| `components/spot/SpotFilter.vue` | 新規 | 検索・フィルター・ソートUI |
| `components/spot/SpotList.vue` | 新規 | スポット一覧 |
| `components/spot/SpotListItem.vue` | 新規 | スポット1件 |
| `components/spot/SpotPagination.vue` | 新規 | ページネーション |
| `components/map/MapView.vue` | 修正 | マーカー描画追加・props追加 |
| `pages/index.vue` | 修正 | SpotPanel追加・composables呼び出し |

---

## データフロー図

```
pages/index.vue
  │
  ├── useSpotFilter（フィルター状態）
  │     ├── useSpots ──→ GET /api/spots ──→ SpotPanel（spots, pagination）
  │     └── useMarkers ─→ GET /api/spots/markers ──→ MapView（markers）
  │
  └── useCategories ──→ GET /api/categories ──→ SpotPanel（categories）
```

フィルター変更時のフロー:
```
SpotFilter（ユーザー操作）
  → emit → SpotPanel → useSpotFilter を更新
  → watch → useSpots.fetchSpots() 自動発火
  → watch → useMarkers.fetchMarkers() 自動発火
```

---

## 実装順序

1. `types/` 3ファイル（型定義）
2. `composables/useSpotFilter.ts`
3. `composables/useCategories.ts`
4. `composables/useSpots.ts`
5. `composables/useMarkers.ts`
6. `components/spot/SpotListItem.vue`
7. `components/spot/SpotList.vue`
8. `components/spot/SpotPagination.vue`
9. `components/spot/SpotFilter.vue`
10. `components/spot/SpotPanel.vue`
11. `pages/index.vue` 更新
12. `components/map/MapView.vue` マーカー描画追加
