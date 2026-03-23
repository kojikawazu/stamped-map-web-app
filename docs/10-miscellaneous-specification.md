# Miscellaneous Specification (その他仕様書)

## 用語集

| 用語 | 説明 |
|------|------|
| スポット (Spot) | ユーザーが訪問した場所の記録単位。名前・座標・カテゴリ・訪問日を持つ |
| カテゴリ (Category) | スポットの分類。デフォルト5種 + ユーザーカスタム追加可能。色で識別 |
| マーカー (Marker) | 地図上にスポットを示すピン。カテゴリの色で表示 |
| クラスタリング (Clustering) | 近接するマーカーをグループ化して表示する地図の機能 |
| ベクタータイル (Vector Tile) | 地図の表示データ形式。クライアント側でスタイリング可能 |
| PostGIS | PostgreSQL の地理空間拡張。座標データの保存・距離計算・空間検索を提供 |
| 生成カラム (Generated Column) | lat/lng から自動算出される geography 型カラム。空間インデックスの対象 |
| JWT | JSON Web Token。認証後にサーバーが発行するトークン。API リクエストの認証に使用 |
| MVP | Minimum Viable Product。最小限の機能で動作する初期リリース |
| CSR | Client-Side Rendering。ブラウザ側でレンダリングする方式 |

## 外部サービス参照

| サービス | 用途 | URL |
|----------|------|-----|
| Supabase | DB (PostgreSQL + PostGIS) + 認証 | https://supabase.com |
| MapTiler Cloud | 地図タイル配信 | https://cloud.maptiler.com |
| Vercel | ホスティング・デプロイ | https://vercel.com |
| MapLibre GL JS | 地図ライブラリ | https://maplibre.org |
| Prisma | ORM | https://www.prisma.io |

## ドキュメント参照

| ドキュメント | URL |
|-------------|-----|
| MapLibre GL JS Docs | https://maplibre.org/maplibre-gl-js/docs/ |
| MapTiler + MapLibre ガイド | https://docs.maptiler.com/maplibre/ |
| Prisma + PostgreSQL | https://www.prisma.io/docs/concepts/database-connectors/postgresql |
| Supabase Auth (JS SDK) | https://supabase.com/docs/reference/javascript/auth-signup |
| Next.js App Router | https://nextjs.org/docs/app |
| Vercel デプロイ | https://vercel.com/docs |

## 開発ツール・ライブラリ（想定）

| ツール | 用途 |
|--------|------|
| Zod | バリデーションスキーマ（クライアント・サーバー共有） |
| Sonner | トースト通知 |
| Tailwind CSS | スタイリング |
| ESLint + Prettier | コード品質 |
| Vitest | テスト |
| GitHub Actions | CI/CD |

## Next.js ディレクトリ構成（想定）

```
app/
├── login/
│   └── page.tsx              ← ログイン画面
├── (main)/
│   └── page.tsx              ← メイン画面（地図 + リスト、CSR）
├── api/
│   ├── spots/
│   │   ├── route.ts          ← GET(一覧), POST(登録)
│   │   ├── markers/
│   │   │   └── route.ts      ← GET(マーカー用軽量データ)
│   │   └── [id]/
│   │       └── route.ts      ← GET(詳細), PUT(更新), DELETE(削除)
│   └── categories/
│       ├── route.ts          ← GET(一覧), POST(追加)
│       └── [id]/
│           └── route.ts      ← PUT(更新), DELETE(削除)
├── layout.tsx
└── globals.css

components/
├── map/
│   ├── MapView.tsx           ← MapLibre GL JS 地図コンポーネント
│   ├── MapMarkers.tsx        ← マーカー描画
│   └── MapCluster.tsx        ← クラスタリング
├── spots/
│   ├── SpotList.tsx          ← スポット一覧
│   ├── SpotModal.tsx         ← 登録・編集モーダル
│   └── SpotDetail.tsx        ← スポット詳細
├── categories/
│   └── CategorySelect.tsx    ← カテゴリ選択・追加UI
├── auth/
│   └── AuthGuard.tsx         ← クライアント側認証ガード
├── ui/
│   ├── Toast.tsx
│   ├── Loading.tsx
│   ├── Pagination.tsx
│   └── EmptyState.tsx
└── layout/
    ├── Header.tsx
    └── Sidebar.tsx

lib/
├── api-client.ts             ← API呼び出し集約（Go移行時にURL変更するだけ）
├── supabase.ts               ← Supabase クライアント（認証用のみ）
├── prisma.ts                 ← Prisma クライアント
├── validations/
│   ├── spot.ts               ← Zodスキーマ（クライアント・サーバー共有）
│   └── category.ts           ← Zodスキーマ（クライアント・サーバー共有）
└── utils/
    └── date.ts

prisma/
├── schema.prisma
├── seed.ts                   ← デフォルトカテゴリ投入
└── migrations/
    └── 001_add_location_column.sql  ← PostGIS 生成カラム + GISTインデックス
```
