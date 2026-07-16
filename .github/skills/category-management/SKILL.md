---
name: category-management
description: 分類管理（辞書）画面の UI 仕様。記事レベル/記事分類/問題分類の一覧・増削改と、既存ページ（記事一覧/記事編集/問題管理/問題編集）のハードコード配列からの置き換え手順
---

# 分類管理（/admin/categories）

これまで `LEVELS`/`CATEGORIES` としてページ内にハードコードされていた配列を、バックエンドの `category` テーブル（API仕様は studyJP-back の `.github/skills/category-management/SKILL.md` を正とする）から取得する形に置き換える。

## 1. 管理画面 `/admin/categories`

- 上部にタブ（または Select）で3つの scope を切り替える：`記事レベル`（ARTICLE_LEVEL）／`記事分類`（ARTICLE_CATEGORY）／`問題分類`（QUESTION_CATEGORY）。
- 各 scope ごとにテーブル一覧（value、状態 Chip「有効/無効」、更新日時、操作列）。ページングは不要（`GET /api/admin/categories?scope=` は全件返す小規模一覧）。
- 「新規追加」ボタン → Dialog（value 入力のみ、react-hook-form で必須+重複エラー表示）→ `POST /api/admin/categories`。
- 各行「編集」→ Dialog（value 変更 + 有効/無効 Switch）→ `PUT /api/admin/categories/{id}`。
- 各行「削除」→ 確認 Dialog → `DELETE /api/admin/categories/{id}`。**使用中でバックエンドが400を返した場合はそのメッセージをそのまま表示する**（フロント側で使用中判定を先読みしない）。
- 有効/無効の切り替えは一覧上の Switch から直接 `PUT` してもよい（`admin/users` の状態切り替え Switch と同じパターン）。

## 2. 既存ページの置き換え

以下、すべて `GET /api/user/categories?scope=` または `GET /api/admin/categories?scope=`（ページの所属に合わせる。ユーザー側ページは user 側、管理側ページは admin 側のエンドポイントを使う）で取得した配列に差し替える。ハードコードされた `LEVELS`/`CATEGORIES` 定数は削除する。

| ページ | 置き換え対象 | 使用するAPI |
|---|---|---|
| `(user)/articles/page.tsx` | 絞り込みの `LEVELS`/`CATEGORIES` | `GET /api/user/categories?scope=ARTICLE_LEVEL` / `ARTICLE_CATEGORY` |
| `admin/articles/page.tsx` | 絞り込みの `LEVELS`/`CATEGORIES` | `GET /api/admin/categories?scope=...`（無効項目も絞り込みには残したいので admin 側を使う） |
| `admin/articles/edit/[[...id]]/page.tsx` | フォームの `LEVELS`/`CATEGORIES` セレクト | `GET /api/admin/categories?scope=...`（status=1 の項目のみ選択肢に出す。編集中の記事が既に無効化された値を持つ場合はその値も選択肢に残し、変更しない限り送信できるようにする） |
| `admin/questions/page.tsx` | 絞り込みの `CATEGORIES` | `GET /api/admin/categories?scope=QUESTION_CATEGORY` |
| `admin/questions/edit/[[...id]]/page.tsx` | 「分類（任意）」の自由入力 TextField | 選択式（Select、空欄可）に変更し `GET /api/admin/categories?scope=QUESTION_CATEGORY` の status=1 項目を選択肢にする |

- 取得先は `src/api/category.ts`（ユーザー側、`request.ts` 経由）と `src/api/admin/category.ts`（管理側、`adminRequest.ts` 経由）に分ける（`api-integration` skill の2インスタンス使い分けと同じ規約）。
- 型は `src/types/category.ts` に `CategoryScope`（`"ARTICLE_LEVEL" | "ARTICLE_CATEGORY" | "QUESTION_CATEGORY"`）、`CategoryItem`、`CategorySavePayload` を定義する。
- 各ページでの取得はマウント時に1回（フィルタ操作のたびに再取得しない）。ローディング中はセレクトを disabled にする。

## 3. ナビゲーション

- `admin/layout.tsx` の Drawer メニューに「分類管理」を追加する（`/admin/categories`）。

## チェックリスト

- [ ] 3 scope それぞれで一覧・追加・編集・有効/無効切り替え・削除が動作する
- [ ] 使用中のカテゴリを削除しようとするとバックエンドの400メッセージがそのまま表示され、削除されない
- [ ] 記事一覧・記事編集・問題管理・問題編集のセレクト/フィルタが、ハードコード配列ではなく本APIから取得した値で描画される
- [ ] 記事編集で既存記事が無効化済みの level/category を持っていても、編集画面が壊れず表示できる
- [ ] user token で `/api/admin/categories` の書き込み系にアクセスすると 403（両端隔離）
