#!/usr/bin/env bash
# check-tracked-secrets.sh の検出パターンの自己テスト。
# 正規表現の修正で検出漏れ（静かに素通りする）が起きないよう、代表パスの分類を固定する。
set -uo pipefail

SCRIPT="$(dirname "$0")/check-tracked-secrets.sh"
failures=0

# 期待どおりの終了コードになるかを 1 パスずつ検証する
# $1 - 期待する終了コード（1 = 検出 / 0 = 素通り）
# $2 - 検査するパス
assert_exit() {
  local expected=$1 path=$2 actual
  printf '%s\n' "$path" | bash "$SCRIPT" --stdin > /dev/null
  actual=$?
  if [ "$actual" -ne "$expected" ]; then
    echo "FAIL: '$path' expected exit $expected, got $actual"
    failures=$((failures + 1))
  fi
}

# N- 検出すべきパス（鍵・.env 系）
for path in \
  config/master.key \
  .env \
  front/.env \
  front/.env.local \
  base/.env.production \
  front/.env.production.local \
  certs/server.pem \
  certs/client.p12 \
  certs/client.pfx \
  android/release.jks \
  android/release.keystore \
  secrets/id_rsa \
  secrets/id_ed25519 \
  secrets/id_dsa \
  gcp/credentials.json \
  gcp/serviceAccountKey.json \
  "日本語/.env"; do
  assert_exit 1 "$path"
done

# S- 素通りすべきパス（テンプレート・型定義・名前が似ているだけのファイル）
for path in \
  front/.env.example \
  front/.env.local.example \
  front/.env.sample \
  front/.env.template \
  config/master.key.dist \
  src/env.d.ts \
  front/.env.d.ts \
  secrets/id_rsa.pub \
  docs/keyboard.md \
  src/apiKey.ts \
  front/environment.ts \
  README.md; do
  assert_exit 0 "$path"
done

# S- 一覧の途中に 1 件でも混入していれば検出する
printf '%s\n' README.md front/.env src/index.ts | bash "$SCRIPT" --stdin > /dev/null
if [ $? -ne 1 ]; then
  echo "FAIL: a secret file among other paths was not detected"
  failures=$((failures + 1))
fi

# S- 不正な引数は使い方の誤り（2）として扱い、検査を素通りさせない
bash "$SCRIPT" --unknown > /dev/null 2>&1
if [ $? -ne 2 ]; then
  echo "FAIL: unknown option should exit 2"
  failures=$((failures + 1))
fi

if [ "$failures" -gt 0 ]; then
  echo "$failures test(s) failed"
  exit 1
fi
echo "OK: all detection pattern tests passed"
