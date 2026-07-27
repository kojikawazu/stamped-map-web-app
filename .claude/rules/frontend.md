---
description: Nuxt.js 3 フロントエンド設計・コンポーネント規約
globs: "front/components/**,front/pages/**,front/composables/**,front/layouts/**,front/stores/**,front/constants/**,front/schemas/**,front/repositories/**,front/utils/**"
---

# フロントエンドルール（Nuxt.js 3）

## コンポーネント設計

- アトミックデザインの3層 `components/atoms/` ・ `components/molecules/` ・ `components/organisms/` に配置する（Issue #7 で採用）。
- 各層の配下に feature サブディレクトリを切る（例: `molecules/spot/`・`molecules/common/`・`organisms/spot/`・`organisms/map/`・`organisms/category/`）。
- `nuxt.config.ts` で `pathPrefix: false` を設定しているため、コンポーネント名はパスを含まずフラットに使用する（例: `<SpotPanel />`）。
- atoms は将来拡張用（現状は `.gitkeep` のみ）。

## ロジック分離

- ロジックは `composables/` に切り出す。コンポーネントは UI 描画に専念する。
- Nuxt 3 の auto-import を活用する（`composables/`, `utils/` は自動インポート対象）。

## 関心別にディレクトリを切る

`types/` `constants/` `schemas/` `repositories/` は**それぞれ独立したディレクトリ**として、Nuxt の規約ディレクトリと同じ階層（`front/` 直下）に置く。いずれも**単一ファイルにまとめない**（`types.ts` / `lib/validations.ts` のような形は禁止。ドメイン単位でファイルを分ける）。詳細は `typescript.md`「型定義の配置」「定数の配置」「スキーマの配置」に従う。

| ディレクトリ | 置くもの | 置かないもの |
|---|---|---|
| `types/` | 2 箇所以上から参照される型 | 値・ロジック |
| `constants/` | 全環境で不変な値 | 環境変数（`runtimeConfig` を使う）・型を導出する定数（`types/` 側へ） |
| `schemas/` | Zod スキーマ（フォーム・Server API の入出力検証） | 検証を伴わない型定義（`types/` へ） |
| `repositories/` | **API アクセス**（`$fetch` / `useFetch` のラッパ） | UI・画面都合の整形・業務判断 |
| `lib/` `utils/` | **通信を持たない純粋ユーティリティ**（座標計算・整形等） | API アクセス（`repositories/` へ）・定数・型 |

- **`$fetch` を書いてよいのは `repositories/` と `server/` だけ**。SFC・composables・`lib/` から直接叩かない。呼び出し口を 1 箇所に閉じることで、認証ヘッダ・エラー処理・リトライの実装が散らばらない。
- ディレクトリ名は**複数形で統一**する（`types` / `constants` / `schemas` / `repositories`）。
- `repositories/` `schemas/` は **Nuxt の auto-import 対象外**（規約ディレクトリではない）。明示的に import する。

> **移行中**: 現状 `$fetch` は `composables/useApiClient.ts` に集約されており（呼び出し口 1 箇所という意図は満たしている）、Zod は `lib/validations/` にある。`repositories/` / `schemas/` への移動は別 issue で対応する（issue #80）。

## レイヤ依存の一方向ルール

**依存は上位から下位への一方向のみ**。下位レイヤが上位レイヤを import してはならない。**auto-import があるため import 文に現れず、逆流が起きても気づきにくい**。参照の向きを意識的に守る。

```
pages  →  components  →  composables  →  repositories  →  lib / schemas  →  types / constants
（画面合成）  （表示）     （ロジック）    （API アクセス） （純粋関数・検証）    （最下層）
```

| レイヤ | 参照してよい | 参照禁止 |
|---|---|---|
| `pages/` | `components/`, `composables/`, `lib/`, `types/`, `constants/` | （なし。pages は誰からも参照されない） |
| `components/` | 下位の `components/`（organisms → molecules → atoms）, `composables/`, `lib/`, `types/`, `constants/` | **`pages/`**, **`repositories/`**・`$fetch` の直接呼び出し（通信は composables 経由） |
| `composables/` | `repositories/`, `lib/`, `schemas/`, `types/`, `constants/` | **`pages/`**, **`components/`**（テンプレートを持たない） |
| `repositories/` | `lib/`, `schemas/`, `types/`, `constants/` | **`pages/`**, **`components/`**, **`composables/`** |
| `lib/` `schemas/` | `types/`, `constants/` | 上位レイヤすべて（`lib/` は通信もしない） |
| `types/` `constants/` | （原則どこにも依存しない） | 上位レイヤすべて |

- **`server/`（Server API）から `components/` `composables/` を参照しない**。サーバー層がクライアント層に依存してはならない（`api.md`）。逆にクライアントから `server/` の実装を import しない（**シークレットを含むコードがクライアントバンドルに混入する**）。共有してよいのは `types/` に置いた契約の型のみ。
- **`components/` 内も一方向**にする。`atoms/` は `molecules/` や `organisms/` を参照しない。
- 同一レイヤ間の**相互依存（循環）**を作らない。

### 逆流したくなったら「共通化」で解決する

| 逆流したい理由 | 正しい解き方 |
|---|---|
| 上位の型・定数を下位でも使いたい | その型・定数を**`types/` `constants/` へ移動**し、上下双方がそこを参照する |
| 上位のロジックを下位でも使いたい | 共通処理を**下位の `composables/` または `lib/` へ抽出**し、双方から呼ぶ |
| 下位から上位の状態を変えたい | **呼ばない**。**`emit` で親に通知する**（イベントは上へ、props は下へ） |
| 子が親のレイアウトを知りたい | 知らせない。**props / slot で親が渡す** |

**レビュー観点**: 参照の向きを見る。下位レイヤのファイルに上位レイヤ（`pages/` / `components/`）の名前が現れていたら指摘する。クライアント側のコードが `server/` の実装を引き込んでいないか。

## ルーティング

- `pages/` ディレクトリによるファイルベースルーティングを使用する。
- ルートファイルを手動で定義しない。

## バリデーション

- フォームバリデーションには Zod スキーマバリデーションを使用する。

## テスト

- E2E: Playwright（`front/tests/` ディレクトリ）
- Base URL: `http://localhost:3000`
