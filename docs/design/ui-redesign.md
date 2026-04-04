# UIデザイン刷新 設計書

> Issue #30 対応

---

## 1. デザイン方針

### コンセプト
「スタンプを集める旅の記録」— 地図を眺めながら訪れた場所を振り返り、次の旅への期待が膨らむUI。

### トーン＆マナー
- **ブランドカラー**: Park Green（公園・散歩）× Coral Orange（温かみ・アクセント）
- **質感**: ガラス風の薄い背景 + 控えめな影で「浮き上がる」感覚
- **動き**: 控えめなトランジションで応答感を演出（過剰なアニメーション禁止）

---

## 2. カラーパレット

| 用途 | 変数名 | 値 |
|------|--------|-----|
| プライマリ（CTA・選択状態） | `--color-primary` | Park Green (#4CAF6F) |
| プライマリホバー | `--color-primary-hover` | (#388E54) |
| プライマリ薄 | `--color-primary-light` | (#E8F5EC) |
| アクセント（メモ・コーラル強調） | `--color-accent` | Coral Orange (#FF8A65) |
| 背景 | `--color-bg` | (#F8FBF9) |
| パネル背景 | `--color-surface` | `white` |
| ボーダー | `--color-border` | (#E0EFE4) |
| テキスト主 | `--color-text` | (#1A2E22) |
| テキスト副 | `--color-text-muted` | (#5A7A64) |
| 危険（削除） | `--color-danger` | (#DC2626) |

---

## 3. コンポーネント別デザイン仕様

### 3-1. ヘッダー（`layouts/default.vue`）

**現状**: 白背景・細ボーダー・テキストロゴのみ

**改善**:
- 背景: `#4CAF6F` グラデーション → `from-#4CAF6F to-#388E54`
- ロゴ: 地図ピンアイコン（SVG）+ "Stamped Map" テキスト（白・bold）
- ログアウトボタン: 白テキスト + `hover:bg-white/20` の透明ボタン
- 高さ: `py-2` → `py-3` で存在感を少し強化

---

### 3-2. ログインページ（`pages/login.vue`）

**現状**: 白背景・薄いボーダーのカード

**改善**:
- 背景: `from-#E8F5EC via-white to-slate-50` のグラデーション
- カード: `shadow-xl` + `ring-1 ring-slate-200`
- タイトル: アイコン付き（地図ピン絵文字 📍 or SVG）
- ログインボタン: `bg-[#4CAF6F]` + `hover:bg-[#388E54]` + ローディングスピナー内蔵

---

### 3-3. 左パネル（`SpotPanel` / `SpotList`）

**現状**: 白背景・フラット・アニメーションなし

**改善**:
- パネル背景: `bg-slate-50` でメイン画面から少し区別
- ヘッダー部: 「スポット一覧」テキストに件数バッジを追加
- 「＋ 登録」ボタン: `bg-[#4CAF6F]` + `hover:bg-[#388E54]` + `+` アイコン
- 「カテゴリ管理」ボタン: アイコン付きアイコンボタン（テキスト省略可）

---

### 3-4. SpotListItem（`molecules/spot/SpotListItem.vue`）

**現状**: 小さなドット + テキストのフラットなリスト

**改善**:
- カード型に変更: `rounded-xl` + `shadow-sm` + `hover:shadow-md` のトランジション
- カテゴリ色を左ボーダー（`border-l-4`）で視覚的に強調
- ホバー時: `hover:translate-x-0.5` で微妙なスライド感
- 選択時: `ring-2 ring-[#4CAF6F]-400` + `bg-#E8F5EC`
- 訪問日を📅アイコン付きで表示

```
┌──────────────────────────────┐
│▎ スポット名（太字）          │  ← border-l-4 カテゴリ色
│  カフェ  ·  2026/01/15 📅   │  ← 副テキスト
└──────────────────────────────┘
```

---

### 3-5. SpotFilter（`organisms/spot/SpotFilter.vue`）

**現状**: 標準input/selectのみ

**改善**:
- 検索ボックス: 🔍アイコン付き + フォーカス時 `ring-2 ring-[#4CAF6F]-300`
- ソートセレクト: カスタム矢印アイコン
- カテゴリバッジ: 選択時に `shadow-sm` + `scale-105` のトランジション

---

### 3-6. SpotDetailDrawer（`organisms/spot/SpotDetailDrawer.vue`）

**現状**: 白背景・フラットなドロワー

**改善**:
- ヘッダー: カテゴリ色のグラデーション帯（薄め）
- スポット名: `text-xl font-bold`
- 座標表示: コードブロック風の背景（`bg-slate-100 rounded-lg font-mono`）
- 編集ボタン: `bg-[#4CAF6F]` の主ボタン
- 削除ボタン: `text-rose-600 border-rose-200` のゴーストボタン

---

### 3-7. モーダル共通（SpotCreateModal / SpotEditModal / CategoryManageModal）

**現状**: 標準的なモーダル

**改善**:
- オーバーレイ: `bg-black/60 backdrop-blur-sm`
- モーダル本体: `shadow-2xl` + スライドイン (`translate-y`) アニメーション
- フォーカス時のフィールド: `ring-2 ring-[#C8EDD4] border-[#B8E0C4]`
- 送信ボタン: `bg-[#4CAF6F]` + ローディング時スピナー

---

### 3-8. 地図マーカー（`organisms/map/MapView.vue`）

**現状**: シンプルな circle レイヤー

**改善**:
- `circle-radius` を `8` に拡大
- `circle-stroke-width` を `2.5` に強化
- ホバー時に拡大する paint expression 追加（`feature-state: hover`）
- クラスターの色を `#4CAF6F → #FF8A65 → #DC2626` に統一（ブランドカラーと一致）

---

## 4. 実装方針

### Tailwind カスタム設定
`assets/css/main.css` に CSS カスタムプロパティとユーティリティクラスを追加:

```css
@import "tailwindcss";

@theme {
  --color-primary: #4CAF6F;      /* Park Green */
  --color-primary-hover: #388E54;
  --color-primary-light: #E8F5EC;
  --color-accent: #FF8A65;       /* Coral Orange */
  --color-surface: #ffffff;
  --color-bg: #F8FBF9;
  --color-border: #E0EFE4;
  --color-danger: #DC2626;
}
```

### アニメーション
既存の Tailwind トランジション（`transition-all duration-150`）を積極活用。
`@keyframes` は最小限（モーダルスライドインのみ）。

### 対応範囲
| ファイル | 変更内容 |
|----------|---------|
| `assets/css/main.css` | CSS カスタムプロパティ定義 |
| `layouts/default.vue` | ヘッダーデザイン |
| `pages/login.vue` | ログインページ |
| `molecules/spot/SpotListItem.vue` | カード型リストアイテム |
| `organisms/spot/SpotFilter.vue` | 検索・フィルターUI |
| `organisms/spot/SpotPanel.vue` | パネルヘッダー・ボタン |
| `organisms/spot/SpotDetailDrawer.vue` | 詳細ドロワー |
| `organisms/spot/SpotCreateModal.vue` | 登録モーダル |
| `organisms/spot/SpotEditModal.vue` | 編集モーダル |
| `organisms/map/MapView.vue` | マーカーサイズ・クラスター色 |

### 変更しないもの
- コンポーネントの責務・ロジック（デザインのみ変更）
- APIルート・composable
- テストコード

---

## 5. 優先順位

| 優先度 | 対象 | 理由 |
|--------|------|------|
| 🔴 高 | ヘッダー・SpotListItem・SpotPanel | 第一印象を決める最重要部分 |
| 🟡 中 | ログインページ・SpotDetailDrawer・モーダル | 操作頻度の高い画面 |
| 🟢 低 | SpotFilter・地図マーカー | 機能的には問題ないが改善効果あり |
