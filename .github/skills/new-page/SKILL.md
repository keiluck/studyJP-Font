---
name: new-page
description: 本プロジェクトでページ（ユーザー側または管理側）を新規追加する際の標準手順。ルート配置、ガード、レイアウトの約束事を含む
---

# ページの新規追加

## 1. ページの所属を決め、正しいルートグループに配置する

- ユーザー側ページ → `src/app/(user)/<パス>/page.tsx`（自動的に AppBar レイアウト＋ユーザーガードが適用される）
- ユーザー側ログイン/登録 → `src/app/(auth)/<パス>/page.tsx`（独立した全画面中央表示レイアウトで、サイト共通フレームは使用せず、管理側ログインと同じ形態）
- 管理側ページ → `src/app/admin/<パス>/page.tsx`（自動的に Drawer レイアウト＋管理ガードが適用される；`/admin/login` は admin/layout がパスによりフレームをスキップする）
- 動的ルートは `[id]` を使用し、任意の catch-all は `[[...id]]` を使用する（新規作成/編集で1つのページを共用する場合など）

`app/` 直下に孤立したページを新規作成しないこと。

## 2. ページテンプレート

```tsx
"use client";

import { useState, useEffect } from "react";
// MUI コンポーネントは必要な分だけインポートする。API呼び出しは src/api/ 配下のラッパー関数を使用する

export default function XxxPage() {
  // ローカル状態は useState を使用する。ログイン状態は store/userAuth または store/adminAuth から読み取る
  return <>{/* MUI レイアウト */}</>;
}
```

要点：

- 先頭行に必ず `"use client"` を書くこと。本プロジェクトでは SSR データ取得を行わない。
- 一覧ページ：絞り込みとページング条件は `useSearchParams` で読み取り、`router.replace` で書き込む。リロード後も状態が保持されるようにする。ページングパラメータは統一して `page`（1始まり）＋ `pageSize` とする。
- 3つの状態を必ず処理すること：loading（Skeleton/CircularProgress）、空データ、リクエスト失敗（Snackbar/Alert）。

## 3. APIと型

- ページ内で直接 axios/fetch を呼ばず、先に `src/api/` の対応するモジュールに関数を追加すること（skill: api-integration を参照）。
- リクエスト/レスポンスの型は `src/types/` に定義し、バックエンドの DTO のフィールドと一致させること。

## 4. ナビゲーション入口

- ユーザー側：`(user)/layout.tsx` の AppBar に入口を追加する。
- 管理側：`admin/layout.tsx` の Drawer メニューに入口を追加する。

## 5. セルフチェック

- `npm run build` で型エラーが無いこと。
- 未ログイン状態でそのURLに直接アクセスするとガードにより対応するログインページへリダイレクトされること（ログイン/登録ページを除く）。
- ブラウザで実際にページの主要フローを一通り操作すること。
