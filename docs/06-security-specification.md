# Security Specification (セキュリティ仕様書)

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
6. API Routes でトークンを検証（共通ヘルパー）
7. 検証OK → Prisma でDB操作を実行
```

### 認証ガード（クライアント側）

```
メイン画面（/）ロード時：
  1. ローディングシェルを表示
  2. Supabase Auth SDK で getSession() を呼び出し
  3. セッションなし → /login にリダイレクト（クライアント側）
  4. セッションあり → メインコンテンツを表示

※ Server Components によるサーバー側リダイレクトは行わない
※ メイン画面は MapLibre（'use client' 必須）のため CSR で完結
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
| メール/パスワード | MVP | 事前作成アカウントのみ |
| Google OAuth | Phase 2 | |

## 認可

### 方針

- 単一ユーザーアプリのため、認可設計は最小限
- 認証済み = 全操作可能（CRUD）
- 未認証リクエストは API Routes で 401 を返却
- データモデルに user_id は持たない（単一ユーザー前提）

### JWT 検証の共通化

全 API Route で JWT 検証を漏れなく実行するため、共通ヘルパーに抽出する。

```typescript
// lib/auth.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export class AuthError extends Error {
  constructor() {
    super('Unauthorized');
  }
}

export async function verifyAuth(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new AuthError();
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthError();
  }

  return user;
}
```

### API Route での使用パターン

```typescript
// app/api/spots/route.ts
import { verifyAuth, AuthError } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await verifyAuth(request);
    // ... Prisma でDB操作
  } catch (e) {
    if (e instanceof AuthError) {
      return Response.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 }
      );
    }
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } },
      { status: 500 }
    );
  }
}
```

> **重要：JWT 検証を1つの API Route でも忘れるとセキュリティホールになる。**
> 全 API Route で `verifyAuth()` を呼び出すこと。

## データアクセス制御

| レイヤー | 制御 |
|----------|------|
| クライアント → DB | **直接アクセス禁止** |
| クライアント → API Routes | JWT 必須 |
| API Routes → DB | Prisma 経由（サーバー側のみ） |
| Supabase 公開サインアップ | **無効化必須** |

> Supabase の RLS（Row Level Security）は補助的に設定可能だが、
> 主たるアクセス制御は API Routes の JWT 検証 + Prisma で行う。

## 暗号化

| 対象 | 方式 |
|------|------|
| 通信 | HTTPS（Vercel / Supabase ともにデフォルト） |
| パスワード | Supabase Auth がハッシュ化（bcrypt） |
| DB接続 | SSL（Supabase デフォルト） |

## 脆弱性対策

| 脅威 | 対策 |
|------|------|
| SQLインジェクション | Prisma のパラメータ化クエリ / `$queryRaw` のテンプレートリテラル |
| XSS | Next.js の自動エスケープ + CSP ヘッダー |
| CSRF | API Routes は Cookie 認証ではなく Bearer トークン方式のため軽減 |
| 不正アクセス | JWT 検証を全 API Routes で実施（共通ヘルパー） |
| 不正サインアップ | Supabase 側で公開サインアップを無効化 |
