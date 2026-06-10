# Security Specification (セキュリティ仕様書)

## 目次

- [認証](#認証)
  - [方式：Supabase Auth（クライアント側）](#方式supabase-authクライアント側)
  - [Supabase 側の設定（必須）](#supabase-側の設定必須)
  - [認証フロー](#認証フロー)
  - [認証ガード（クライアント側）](#認証ガードクライアント側)
  - [トークンリフレッシュ戦略](#トークンリフレッシュ戦略)
  - [アカウント管理](#アカウント管理)
  - [対応する認証方式](#対応する認証方式)
- [認可](#認可)
  - [方針](#方針)
  - [JWT 検証の共通化](#jwt-検証の共通化)
  - [オーナー制限ヘルパー](#オーナー制限ヘルパー)
  - [Server Route での使用パターン](#server-route-での使用パターン)
- [データアクセス制御](#データアクセス制御)
- [暗号化](#暗号化)
- [脆弱性対策](#脆弱性対策)

## 認証

### 方式：Supabase Auth（クライアント側）

- クライアントで `@supabase/supabase-js` を使用してログイン
- **サインアップ機能は提供しない**
- アカウントは Supabase ダッシュボードで事前作成（手運用）
- パスワード再設定も Supabase ダッシュボードで実施
- 認証後、Supabase が JWT トークンを発行
- JWT を API リクエストの `Authorization: Bearer <token>` ヘッダーに付与

### Supabase 側の設定（必須）

- **Supabase ダッシュボード → Authentication → Settings で公開サインアップ（Enable sign-ups）を無効化する**
- これにより、API 経由の自己登録も完全にブロックされる
- UI からサインアップ画面を削除するだけでは不十分（Supabase Auth API を直接叩かれると登録できてしまう）

### 認証フロー

```
1. ユーザーがログイン画面でメール/パスワードを入力
2. Supabase Auth SDK（signInWithPassword）が認証処理を実行
3. 成功 → JWT トークンをクライアントに返却
4. クライアントはトークンを保持（Supabase SDK が自動管理）
5. API リクエスト時にトークンを Authorization ヘッダーに付与
6. Server API（Server Routes）でトークンを検証（共通ヘルパー `verifyAuth`）
7. 検証OK → Prisma でDB操作を実行
```

### 認証ガード（クライアント側）

```
メイン画面（/）ロード時：
  1. Nuxt ルートミドルウェア（middleware/auth.ts）が発動
  2. useSupabaseUser() で認証状態を判定
  3. 未認証 → navigateTo("/login") でリダイレクト（クライアント側）
  4. 認証済み → メインコンテンツを表示

※ SSR では import.meta.server でガードをスキップし、ハイドレーション後に評価する
※ 地図 SPA（全ページ要認証）のため、このクライアント側ガードで完結
```

### トークンリフレッシュ戦略

```
1. Supabase JWT のデフォルト有効期限：1時間
2. クライアント側の SDK が自動リフレッシュ

API が 401 を返した場合のクライアント側対応：
  1. supabase.auth.refreshSession() を実行
  2. 成功 → 新しいトークンでリクエストをリトライ（1回のみ）
  3. 失敗 → ログイン画面にリダイレクト
```

### アカウント管理

| 操作 | 手段 |
|------|------|
| アカウント作成 | Supabase ダッシュボード（Authentication → Users → Add user） |
| パスワード再設定 | Supabase ダッシュボード |
| アカウント削除 | Supabase ダッシュボード |

> すべて手運用。アプリ側にアカウント管理機能は不要。

### 対応する認証方式

| 方式 | 対応 | 備考 |
|------|------|------|
| メール/パスワード | 対応済み | 事前作成アカウントのみ |
| Google OAuth | 対応済み | `ALLOWED_EMAILS` でWrite操作を制限 |

## 認可

### 方針

- Google OAuth 導入により、任意の Gmail ユーザーがログイン可能
- **閲覧（GET）**: 認証済みユーザー全員が可能
- **Write操作（POST / PUT / DELETE）**: 環境変数 `ALLOWED_EMAILS` に登録されたオーナーのみ許可
- 未認証リクエストは Server API で 401 を返却
- 非オーナーによる Write操作は 403 を返却
- データモデルに user_id は持たない（単一オーナー前提）

### JWT 検証の共通化

全 Server Route で JWT 検証を漏れなく実行するため、共通ヘルパーに抽出する。

```typescript
// server/utils/auth.ts
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { H3Event } from 'h3';

// singleton クライアント（リクエストごとの生成を避ける）
let _supabaseAuth: SupabaseClient | null = null;

function getSupabaseAuth(): SupabaseClient {
  if (!_supabaseAuth) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    if (!url || !key) {
      throw createError({ statusCode: 500, message: 'サーバー設定エラー' });
    }
    _supabaseAuth = createClient(url, key);
  }
  return _supabaseAuth;
}

export async function verifyAuth(event: H3Event) {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '');
  if (!token) {
    throw createError({ statusCode: 401, message: '認証が必要です' });
  }
  const { data: { user }, error } = await getSupabaseAuth().auth.getUser(token);
  if (error || !user) {
    throw createError({ statusCode: 401, message: '認証が無効です' });
  }
  return user;
}
```

### オーナー制限ヘルパー

Write系操作はオーナー確認を追加した `verifyOwner()` を使用する。

```typescript
// server/utils/auth.ts に追加
export async function verifyOwner(event: H3Event) {
  const user = await verifyAuth(event);
  const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowedEmails.includes((user.email ?? "").toLowerCase())) {
    throw createError({ statusCode: 403, message: "操作が許可されていません" });
  }
  return user;
}
```

### Server Route での使用パターン

```typescript
// GET系（閲覧）: verifyAuth のみ
export default defineEventHandler(async (event) => {
  await verifyAuth(event);
  // ...
});

// POST / PUT / DELETE（Write系）: verifyOwner を使用
export default defineEventHandler(async (event) => {
  await verifyOwner(event);
  // ...
});
```

> **重要：JWT 検証を1つの Server Route でも忘れるとセキュリティホールになる。**
> GET系は `verifyAuth()`、Write系は `verifyOwner()` を必ず呼び出すこと。
> `createError()` は H3 のグローバル関数として自動 import される（Nuxt Server Routes 内）。

## データアクセス制御

| レイヤー | 制御 |
|----------|------|
| クライアント → DB | **直接アクセス禁止** |
| クライアント → Server API | JWT 必須 |
| Server API → DB | Prisma 経由（サーバー側のみ） |
| Supabase 公開サインアップ | **無効化必須** |

> Supabase の RLS（Row Level Security）は補助的に設定可能だが、
> 主たるアクセス制御は Server API の JWT 検証 + Prisma で行う。

## 暗号化

| 対象 | 方式 |
|------|------|
| 通信 | HTTPS（Vercel / Supabase ともにデフォルト） |
| パスワード | Supabase Auth がハッシュ化（bcrypt） |
| DB接続 | SSL（Supabase デフォルト） |

## 脆弱性対策

| 脅威 | 対策 |
|------|------|
| SQLインジェクション | Prisma のパラメータ化クエリ（`$queryRaw` の文字列結合は禁止） |
| XSS | Vue.js / Nuxt.js の自動エスケープ（CSP ヘッダーは未実装・将来予定） |
| CSRF | Server API は Cookie 認証ではなく Bearer トークン方式のため軽減 |
| 不正アクセス | JWT 検証を全 Server API で実施（共通ヘルパー `verifyAuth` / `verifyOwner`） |
| 不正サインアップ | Supabase 側で公開サインアップを無効化 |
| 非オーナーによるWrite操作 | `verifyOwner()` で 403 を返却（`ALLOWED_EMAILS` による制限） |
