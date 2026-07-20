---
name: permissions-module
description: 権限モジュールの標準仕様。①学習者向けコンテンツの無料/VIPロックUI（記事・英語精読・問題演習）、②ユーザー管理でのVIP付与UI、③管理画面メニューの管理者ロール別表示制御と管理者アカウント管理ページ。既存の全モジュールを横断する変更を含む
---

# 権限モジュール（コンテンツの無料/VIP + 管理画面のロール別メニュー）

API 契約の正はバックエンド（studyJP-back）の `.github/skills/permissions-module/SKILL.md`。この機能は単一ページではなく、既存の複数モジュール（記事一覧/詳細、英語精読一覧/詳細、問題演習、ユーザー管理、管理者ログイン、admin レイアウトの Drawer メニュー）を横断して変更する。

## 1. 型・状態の拡張

- `types/index.ts` の `UserInfo` に `vip: boolean` / `vipExpireAt: string | null` を追加する（`/api/user/me` のレスポンスに含まれる）。`userAuth` store はそのまま `UserInfo` を保持しているので、型を拡張するだけでログイン中のVIP状態が使えるようになる。
- `types/index.ts` の `AdminInfo` に `role: AdminRole` を追加する。`AdminRole = "SUPER_ADMIN" | "CONTENT_ADMIN" | "USER_ADMIN"` は新規 `types/permission.ts` に定義する。`adminAuth` store は localStorage にそのまま JSON 保存する既存方式なので、ログインレスポンスに `role` を含めれば自動的に永続化される（`/api/admin/me` のような再取得エンドポイントは存在しないし、追加しない）。
- 記事一覧/詳細型（`ArticleListItem`/`ArticleDetail`）、英語精読一覧/詳細型（`EnArticleListItem`/`EnArticleDetail`）、問題関連の型に `accessLevel: 0 | 1`（0=無料試読 1=VIP限定）を追加する。

## 2. 学習者向け：コンテンツのVIPロックUI

1. **一覧ページ**（`/articles`、`/en-articles`）：`accessLevel === 1` の項目に小さな鍵アイコン付き「VIP」バッジを重ねる（ロックしているだけで一覧からは消さない——クリック自体は妨げない）。バッジの判定は「VIP限定コンテンツかどうか」だけを表す（自分がVIPかどうかは問わない。自分がVIPなら見た目上バッジがあっても普通に読める）。
2. **詳細ページ**（`/articles/[id]`、`/en-articles/[id]`）：API が 403 を返した場合（VIP限定コンテンツに無料会員がアクセスした場合）、既存の汎用エラー `Alert` ではなく専用の「VIP限定コンテンツです」案内 UI を表示する（見出し・鍵アイコン・「Sadly you need VIP」的な文言は使わず「この記事はVIP会員限定です」、一覧に戻るボタン）。通信エラーと権限エラーを見分けるため、axios のエラーオブジェクトから HTTP ステータス（またはインターセプターが解包した `code`）を見て分岐する。
3. **問題演習**：出題プールはサーバー側で既に絞り込まれているため、フロント側で特別な分岐は不要（無料会員には最初から無料問題しか配信されない）。

## 3. ユーザー管理：VIP付与UI（`/admin/users`）

- 一覧テーブルに「VIP」列を追加する（VIPなら期限日、そうでなければ「-」）。
- 各行に「VIP設定」ボタン（Dialog）を追加する：日付選択で `vipExpireAt` を設定する新規 API `PUT /api/admin/users/{id}/vip` を呼ぶ。「VIP解除」ボタン（null を送る、または確認ダイアログ）も用意する。
- このページ自体は `USER_ADMIN` にも見えるページなので、`CONTENT_ADMIN` 専用の機能（記事等の accessLevel 設定）とは無関係。

## 4. 管理画面メニューの権限制御

1. **`admin/layout.tsx` の Drawer `MENU` 配列を拡張**し、各項目に `roles: AdminRole[]` を持たせる：
   - ユーザー管理：`["SUPER_ADMIN", "USER_ADMIN"]`
   - 記事管理／英語精読管理／問題管理／分類管理／主図バナー管理：`["SUPER_ADMIN", "CONTENT_ADMIN"]`
   - 管理者アカウント管理（新規）：`["SUPER_ADMIN"]`
   - 表示時は `MENU.filter((item) => item.roles.includes(admin?.role))` で絞り込む。
2. **直接URLアクセスのガード**：`admin/layout.tsx` に、現在の `pathname` が属するメニュー項目の `roles` に現在の管理者の `role` が含まれるかチェックするロジックを追加し、含まれなければ `/admin`（ダッシュボード相当のトップ）へ `router.replace` する。これは UX 向上のためであり、**真の防御はバックエンドの SecurityConfig 側**（フロントのガードだけに依存しないこと）。
3. **新規ページ `/admin/admins`**（SUPER_ADMIN 専用、管理者アカウント管理）：一覧テーブル（ユーザー名/ロール/状態/作成日時）＋新規作成・編集 Dialog（ユーザー名・メール・パスワード・ロール選択・有効/無効）。既存の `/admin/categories` の Dialog ベース CRUD パターンを参考にする（このページはファイルアップロードを伴わない単純なフラット CRUD のため、`/admin/articles` のような専用編集ページより `/admin/categories` の Dialog パターンの方が適している）。

## 5. 管理側：コンテンツ編集フォームに公開レベルを追加

`/admin/articles/edit`・`/admin/en-articles/edit`・`/admin/questions/edit` の各フォームに、ステータス（下書き/公開）選択の近くに「公開レベル」選択（無料試読 / VIP限定）を追加する。既存の `status`（0/1）選択 UI と横に並べる形で違和感なく統合すること。

## 6. 実装の要点

- ログインレスポンスに `role`/`vip` が含まれるようになるので、`api/admin.ts`（ログイン）・`api/user.ts`（ログイン/登録/me）の型を更新するだけでよく、新規APIファイルを追加する必要はない（管理者アカウント管理用の `api/admin/adminAccount.ts` は新規追加）。
- VIPロックUIも管理者ロールメニューも、**バックエンドが返す実データ（`accessLevel`/`vip`/`role`）だけを根拠にする**——フロント側でアクセス可否を独自に計算するロジック（例えば記事IDの偶奇で判定するような）は絶対に書かないこと。
- 英語精読モジュール（中国語UI）や日本語コースモジュールのコンポーネント自体は改変せず、ロックバッジ・エラー分岐は各詳細ページの表示ロジックに追記する形で最小限の変更に留める。

## 7. テスト観点

- 無料会員でVIP限定記事の詳細ページを開くと、専用のVIP案内UIが出ること（汎用エラー画面ではないこと）。
- VIP会員（`vipExpireAt` が未来）でVIP限定記事が問題なく開けること。
- 管理画面に `CONTENT_ADMIN` でログインすると「ユーザー管理」「管理者アカウント管理」がDrawerに出ないこと。URLを直接叩いても `/admin` にリダイレクトされること。
- 管理画面に `USER_ADMIN` でログインすると「記事管理」等が出ないこと。
- `/admin/users` でVIP設定した直後、一覧のVIP列に期限日が反映されること。
- 記事編集フォームで「VIP限定」を選んで保存すると、一覧のバッジ表示に反映されること。
