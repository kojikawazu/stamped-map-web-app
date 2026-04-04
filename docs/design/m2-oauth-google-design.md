# M2 OAuth認証（Google）設計書

## 対象フェーズ

| フェーズ | 内容 |
|---------|------|
| M2 追加 | 既存メール/パスワード認証に Google OAuth ログインを追加 |

---

## 背景・目的

- 現状はメール/パスワード認証のみ（Supabase Auth `signInWithPassword`）
- パスワード管理が不要な Google OAuth を追加し、ログインを簡便化する
- 個人利用のため、サインアップは引き続き提供しない

---

## 認証フロー

```
1. ログイン画面で「Google でログイン」ボタンをクリック
2. supabase.auth.signInWithOAuth({ provider: "google" }) を呼び出し
3. Google の OAuth 同意画面にリダイレクト
4. 認証成功 → Supabase が PKCE フローを処理
5. @nuxtjs/supabase が自動的にコールバックを処理しセッションを確立
6. redirectTo に指定した URL（/）へリダイレクト
7. middleware/auth.ts が認証済みを確認 → メイン画面表示
```

> `@nuxtjs/supabase` は PKCE フローのコールバック処理を自動化するため、
> Next.js のような `/auth/callback` ルートを自前実装する必要はない。

---

## 変更ファイル

| ファイル | 種別 | 変更内容 |
|---------|------|---------|
| `composables/useAuth.ts` | 修正 | `loginWithGoogle()` メソッド追加 |
| `pages/login.vue` | 修正 | Google ログインボタン追加、UI調整 |
| `docs/11-tasks.md` | 修正 | タスク進捗更新 |

---

## Composable 設計

### `composables/useAuth.ts` 追加メソッド

```typescript
const loginWithGoogle = async (): Promise<void> => {
  const siteUrl = useRuntimeConfig().public.siteUrl;
  const redirectBase = siteUrl || window.location.origin;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${redirectBase}/`,
    },
  });
  if (error) throw new Error("Googleログインに失敗しました");
};
```

---

## UI設計

### ログイン画面レイアウト

```
┌─────────────────────────────┐
│       Stamped Map           │
│  アカウントにログインして...  │
│                             │
│ ┌─────────────────────────┐ │
│ │  [G] Google でログイン   │ │  ← 新規追加（白背景・ボーダー）
│ └─────────────────────────┘ │
│                             │
│ ─────── または ───────      │  ← 新規追加（区切り線）
│                             │
│ メールアドレス               │
│ [input]                     │
│ パスワード                  │
│ [input]                     │
│ [エラーメッセージ]           │
│ [ログイン]                  │
└─────────────────────────────┘
```

### Google ボタン仕様

- 白背景・グレーボーダー・Google ロゴ（SVG）付き
- ホバー時: 薄いグレー背景
- クリック中: `submitting` フラグで無効化（メールログインと共有）

---

## 環境変数

| 変数名 | 用途 | 備考 |
|--------|------|------|
| `NUXT_PUBLIC_SITE_URL` | OAuth リダイレクト先ベースURL | 本番: `https://your-domain.vercel.app`、ローカル: 省略可（`window.location.origin` にフォールバック） |

---

## Supabase ダッシュボード設定（事前作業）

1. **Authentication → Providers → Google** を有効化
   - Google Cloud Console で OAuth 2.0 クライアントID を作成
   - Client ID / Client Secret を設定
2. **Authentication → URL Configuration**
   - Site URL: 本番URL（例: `https://your-domain.vercel.app`）
   - Redirect URLs に以下を追加:
     - `http://localhost:3099/**`（ローカル開発用）
     - `https://your-domain.vercel.app/**`（本番用）

---

## nuxt.config.ts 追加設定

既存の `runtimeConfig.public` に `siteUrl` を追加する（`maptilerKey` はそのまま残す）:

```typescript
runtimeConfig: {
  // サーバー側のみ
  databaseUrl: "",
  directUrl: "",
  // クライアントに公開する変数
  public: {
    maptilerKey: "",       // 既存（NUXT_PUBLIC_MAPTILER_KEY）
    siteUrl: "",           // 追加（NUXT_PUBLIC_SITE_URL）
  },
},
```

## .env / .env.example 追加内容

```
# Site URL（OAuth リダイレクト先ベースURL）
# 本番: https://your-domain.vercel.app
# ローカル: 省略可（window.location.origin にフォールバック）
NUXT_PUBLIC_SITE_URL=
```

---

## 実装順序

1. `nuxt.config.ts` に `siteUrl` runtimeConfig 追加
2. `composables/useAuth.ts` に `loginWithGoogle()` 追加
3. `pages/login.vue` に Google ボタン・区切り線追加
4. `.env` / `.env.example` に `NUXT_PUBLIC_SITE_URL` 追加
