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
| Nuxt.js 3 ドキュメント | https://nuxt.com/docs |
| @nuxtjs/supabase | https://supabase.nuxtjs.org/ |
| Vercel デプロイ | https://vercel.com/docs |

## 開発ツール・ライブラリ

| ツール | 用途 |
|--------|------|
| Zod | バリデーションスキーマ（クライアント・サーバー共有） |
| vue-sonner | トースト通知 |
| Tailwind CSS v4 | スタイリング |
| ESLint | コード品質 |
| Vitest + @nuxt/test-utils | テスト |
| Playwright | E2Eテスト |
| GitHub Actions | CI/CD |

> ディレクトリ構成の詳細は `docs/09-architecture-specification.md` を参照。
