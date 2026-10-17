#!/usr/bin/env bash
# Git 管理下（インデックス）に秘匿ファイル（鍵・.env 系）が含まれていないかを検査する。
#
# .gitignore は未追跡ファイルにしか効かない（git add -f や追跡済みファイルは止められない）。
# 一度 push した秘匿ファイルは追跡除外しても履歴に残るため、対処は鍵のローテーションしかない。
# そこで「追跡された時点で落とす」検出側として CI で常時実行する。
#
# 使い方:
#   bash scripts/check-tracked-secrets.sh          # git ls-files を検査する（CI / ローカル）
#   printf '%s\n' a/.env | bash scripts/check-tracked-secrets.sh --stdin
#                                                  # 標準入力のパス一覧を検査する（パターンの自己テスト用）
#
# 終了コード: 0 = 秘匿ファイルなし / 1 = 秘匿ファイルあり / 2 = 使い方の誤り
set -euo pipefail

# 検出対象: 鍵・証明書・認証情報ファイル、.env 系（.env / .env.local / .env.production 等）
SECRET_PATTERN='(^|/)(\.env(\..+)?|[^/]+\.(key|pem|p12|pfx|jks|keystore)|id_rsa|id_ed25519|id_dsa|credentials\.json|serviceAccountKey\.json)$'
# 除外: テンプレート（*.example 等）と型定義（*.env.d.ts）。値を持たないため誤検知になる
ALLOW_PATTERN='\.(example|sample|template|dist)$|\.env\.d\.ts$'

case "${1:-}" in
  "")
    # -z で取得する。既定の出力は非 ASCII を含むパスを "..." でクォートし、
    # 末尾の " が $ アンカーを外して検出漏れになるため。
    paths=$(git ls-files -z | tr '\0' '\n')
    ;;
  --stdin)
    paths=$(cat)
    ;;
  *)
    echo "usage: $0 [--stdin]" >&2
    exit 2
    ;;
esac

# grep は一致なしで 1 を返すため、pipefail 下で落ちないよう || true で吸収する
tracked=$(printf '%s\n' "$paths" | grep -E "$SECRET_PATTERN" | grep -vE "$ALLOW_PATTERN" || true)

if [ -n "$tracked" ]; then
  echo "::error::秘匿ファイルが Git 管理下にあります。.gitignore への追加や git rm --cached では履歴から消えないため、鍵・トークンのローテーションが必要です。"
  printf '%s\n' "$tracked"
  exit 1
fi

echo "OK: 追跡対象に秘匿ファイルはありません"
