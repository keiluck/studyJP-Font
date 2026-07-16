---
name: api-integration
description: バックエンドAPIと連携する際の標準手順。2つの axios インスタンスの使い分け、型定義、ページングとエラー処理の約束事を含む
---

# バックエンドAPIとの連携

## 1. 正しい axios インスタンスを選ぶ（重要）

| APIプレフィックス | インスタンス | token key |
|----------|------|-----------|
| `/api/user/**` | `src/api/request.ts` | `user_token` |
| `/api/admin/**` | `src/api/adminRequest.ts` | `admin_token` |

両者の混用は厳禁。新しいAPIファイルの配置：ユーザー側の機能は直接 `src/api/`（例：`article.ts`）に、管理側の機能は `src/api/admin/` に配置する。

## 2. 型を定義する（src/types/）

バックエンドの DTO のフィールドと完全に一致させる。ページングレスポンスは統一して以下の形とする：

```ts
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

## 3. API関数を書く

```ts
// src/api/article.ts
import request from "./request";
import type { Article, PageResult } from "@/types";

export interface ArticleQuery {
  page: number;      // 1始まり
  pageSize: number;
  level?: string;
  category?: string;
}

export function fetchArticles(params: ArticleQuery) {
  return request.get<PageResult<Article>>("/api/user/articles", { params });
}
```

約束事：

- インターセプターが既に `{ code, message, data }` を `data` に解包し、200 以外の場合はエラーを投げる。業務関数はそのままデータの型を返せばよい。
- 401 はインターセプターが統一的に token をクリアしてログインページへ遷移する。**ページ側のコードで401を再判定しないこと**。
- ページ内のエラー処理はユーザーへの通知（Snackbar/Alert）のみとし、エラーメッセージはバックエンドが返す `message` を優先して使用する。

## 4. リッチテキストフィールドの約束事

記事には2つのリッチテキストフィールドがある（バックエンドの登録前に jsoup のホワイトリストでフィルタ済み）：

- `content`：日本語本文。**段落単位でそのまま貼り付ければよく**、フロント側で `。！？` により自動分文して表示する。
- `translation`：中国語訳（空の場合あり）。同様に段落単位でそのまま貼り付ければよく、フロント側で自動分文した後、日本語の文と**順番通りに一対一で対応付ける**（両者を `。！？` で分割した文の数が一致していれば対応付けられる）。

管理側の編集ページでは2つの wangEditor でそれぞれ入力する。保存時は空のエディタ内容（`<p><br></p>`）を空文字に正規化してから送信すること。

## 5. ファイルアップロード（管理側）

- 音声：`POST /api/admin/upload/audio`（mp3/m4a/wav、50MB以下）
- 画像：`POST /api/admin/upload/image`（jpg/png/webp、5MB以下）
- `FormData` ＋ `adminRequest` を使用する。フロント側でも拡張子/サイズの事前チェックを行い、失敗時は明確なメッセージを表示する。返された URL はそのままアクセス可能（バックエンドの静的マッピング `/uploads/**`）。

## 6. 結合テスト時のセルフチェック

- DevTools の Network で確認：リクエストヘッダーに正しい token が付与されているか、ページングパラメータが `page`/`pageSize` になっているか。
- 誤った token や期限切れの token で対応するログインページへリダイレクトされることを確認する。
- バックエンドのAPIが未整備の場合は api 層で一時的にダミーデータを返してよいが、`// TODO: mock` の目印を付け、結合テスト時に取り除くこと。
