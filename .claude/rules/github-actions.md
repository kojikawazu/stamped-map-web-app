---
description: GitHub Actions ワークフロー規約 — 発火トリガ・concurrency・パスフィルタ・actionlint による検査
globs: ".github/workflows/**"
---

# GitHub Actions ワークフロー規約

**「同じ内容を二度走らせない」「止めてはいけないものを止めない」「ワークフロー自体も検査する」** を原則とする。

## 現在のワークフロー

| ファイル | 役割 | パスフィルタ |
|---|---|---|
| `ci.yml` | 品質ゲート（`test` / `it` / `e2e`） | あり（`front/**` / `ci.yml`） |
| `secret-scan.yml` | 鍵・`.env` 系の追跡混入の検出（`security.md`） | **なし**（常時実行） |
| `actionlint.yml` | ワークフロー自体の検査（actionlint + shellcheck） | **なし**（常時実行） |

## 1. 発火トリガ（二重実行を作らない）

- **`push` は `main` のみ**にする。作業ブランチ（`feat/**` / `fix/**` / `chore/**` 等）を `push` に並べない。
  - 作業ブランチに push すると `push` と `pull_request` の両方で同じ内容が走り、`it` / `e2e` のような重量ジョブのコストがそのまま倍になる。作業ブランチは PR で回れば十分。
- `pull_request` は `branches: [main]`（main 向けの PR）とする。

## 2. concurrency（古い実行を積み上げない）

重量ジョブを持つワークフローには `concurrency` を付ける。

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

- `group` にワークフロー名を含める（別ワークフロー同士がキャンセルし合わないため）。
- **キャンセルは PR のみ**にする。PR の古い実行は新しい push で無意味になるが、`main` への push はマージごとの検証結果であり、途中で消すと「どのマージで壊れたか」を追えなくなる。

## 3. パスフィルタ（止めてはいけないものを止めない）

- **ワークフローレベルの `paths` / `paths-ignore` は、必須チェック（required status check）にしないワークフローにだけ使う。** ワークフローが起動しないとチェックが `pending` のまま残り、PR がマージ不能になる（ジョブレベル `if:` でのスキップは "skipped" = 成功扱い）。
- **数秒で終わる検査（Secret scan / actionlint）はパスで絞らず常時実行する。** 絞って得る節約より、検査漏れ・必須チェック化の詰まりのほうが高くつく。
- `ci.yml` は現状ワークフローレベルの `paths` を使っている。`main` にブランチ保護を掛けて必須チェック化する時点で、**変更判定ジョブ + ジョブレベル `if:`** へ移行する。

## 4. actionlint（ワークフロー自体の検査）

`run:` 内のシェルはレビューで最も見落とされる層である。actionlint は `run:` を取り出して shellcheck にかけ、式（`${{ }}`）の型・`runs-on` ラベル・action の入力名も検査する。

- **公式 Docker イメージをタグ固定で使う**（`Makefile` の `ACTIONLINT_IMAGE`）。イメージには shellcheck / pyflakes が同梱される。
  - バイナリ単体や `brew install` だと、shellcheck が無い環境で `run:` の検査が**エラーにも警告にもならず静かにスキップ**され、終了コード 0 のまま通る。
- **コマンドの定義は `Makefile` の `actionlint` ターゲットだけ**に置き、CI（`actionlint.yml`）もローカルも `make actionlint` を呼ぶ。コマンド文字列やイメージタグを 2 箇所に書き写さない（CI とローカルで検査がずれる）。
- ワークフローを変更したら、push 前に `make actionlint`（Docker 必須）を実行する。
- actionlint のバージョンを上げる場合は `ACTIONLINT_IMAGE` のタグを更新し、全ワークフローが通ることを確認する。

## 5. 共通の書き方

- ワークフロー（またはジョブ）に **`permissions: contents: read`** を明示し、必要な権限だけを足す。
- 各ジョブに **`timeout-minutes`** を付ける（ハングしたジョブで実行枠を使い切らない）。
- **信頼できない入力**（`github.event.pull_request.title` / `body`、`github.head_ref`、コミットメッセージ等）を `run:` に `${{ }}` で直接埋め込まない。`env:` で受けてシェル変数として参照する（コマンドインジェクション対策）。
- Vercel のデプロイ制御は GitHub Actions ではなく `vercel.json` で行う（`vercel.md`）。
