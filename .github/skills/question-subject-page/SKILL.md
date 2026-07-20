---
name: question-subject-page
description: 問題演習の学科（大分類）UI仕様。/practice の2階層カード（学科→分類）、管理画面の学科フィールド・フィルタ追加
---

# 問題演習の学科（大分類）— フロントエンド仕様

バックエンドの `question-subject-module` skill（studyJP-back）に対応。新しいページは作らず、既存の `/practice` エントリページと admin の分類管理・問題管理ページを拡張する。

## 1. `/practice` エントリページ（`src/app/(user)/practice/page.tsx`）

既存の単一階層カードグリッド（すべて/文法/発音/…）を2階層に変更する。

1. **学科選択（初期表示）**：`fetchCategories("QUESTION_SUBJECT")` の値 + 「すべて」タイルをカードグリッドで表示。
   - 「すべて」クリック → 即 `startPractice({})` で全学科横断ランダム開始（従来の挙動）。
   - 特定学科クリック → state を更新して②へ遷移（画面遷移ではなくコンポーネント内 state、URLクエリは使わない）。
2. **分類選択（学科選択後）**：`fetchCategories("QUESTION_CATEGORY", subject)`（学科でスコープされた分類のみ）+ 「すべて」タイル。上部に選択中の学科名 + 「戻る」ボタン（①に戻る）。
   - カードクリック → `startPractice({ subject, category })`（「すべて」なら `category` 省略）。

## 2. 管理画面：分類管理ページ（`src/app/admin/categories/page.tsx`）

- scope タブに「問題学科」（`QUESTION_SUBJECT`）を追加。
- scope が `QUESTION_CATEGORY` のときだけ、学科サブセレクタ（`QUESTION_SUBJECT` の一覧から取得）を表示する。一覧取得・新規作成・編集フォームすべてに選択中の `subject` を含める。他 scope では非表示（従来通り）。

## 3. 管理画面：問題編集ページ（`src/app/admin/questions/edit/[[...id]]/page.tsx`）

- 既存の「分類」select（`QUESTION_CATEGORY` 辞書）と同じ実装パターンで「学科」select（`QUESTION_SUBJECT` 辞書、**必須**）を追加。フィールド順：種別/状態/公開レベル/学科/分類。
- 「学科」の変更を watch し、変わったら「分類」の選択肢を `fetchAdminCategories("QUESTION_CATEGORY", subject)` で再取得する。学科を変えたら選択済みの分類はリセットする（バックエンドも学科と一致しない分類は400で拒否するため、フロントでも事前に防ぐ）。
- 既存の「編集中の値が既に無効化されていても選択肢に残す」ロジックは学科・分類の両方で維持する。

## 4. 管理画面：問題一覧ページ（`src/app/admin/questions/page.tsx`）

- フィルタ行に「学科」select を追加（`type`/`category`/`status` と同じ URL クエリパターン：`?subject=`）。
- 「分類」フィルタの選択肢は「学科」フィルタの選択に応じて再取得する。学科未選択（すべて）のときは `subject` を渡さず全学科の分類を取得する。
- テーブルに「学科」列を追加（分類列の隣）。

## 5. 型・API

- `types/category.ts` の `CategoryScope` に `"QUESTION_SUBJECT"` を追加。`CategoryItem`/`CategoryCreatePayload`/`CategoryUpdatePayload` に `subject?: string | null`。
- `api/category.ts`・`api/admin/category.ts` の `fetchCategories`/`fetchAdminCategories` に第2引数 `subject?: string` を追加。
- `types/quiz.ts`：`PracticeStartPayload.subject?`、`AdminQuestionListItem.subject`、`AdminQuestionDetail.subject`、`QuestionSavePayload.subject`（必須）。

## チェックリスト

- [ ] `/practice`：学科カード→分類カードの2階層遷移、「戻る」で①に戻れる
- [ ] `/practice`：「すべて」（学科レベル）で即開始、出た問題の学科が混在してよい（従来通り）
- [ ] `/practice`：特定学科→特定分類で開始した練習は、その学科・分類の問題のみで構成される
- [ ] admin 分類管理：学科タブで学科の増削改ができる；問題分類タブで学科を切り替えると分類リストが切り替わる
- [ ] admin 問題編集：学科を変更すると分類の選択肢が切り替わり、旧学科の分類値は保持されない
- [ ] admin 問題一覧：学科フィルタ・学科列が機能する
