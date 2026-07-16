---
name: mobile-home-list
description: モバイル端利用者側のホームページ——記事一覧ページ。記事一覧を読み込み、タイトル＋先頭行の要約を表示し、クリックで読書ページへ遷移する。loading のぐるぐる表示、エラー時のリトライ、空状態の3つの状態を含む。
---

# 利用者側ホームページ：記事一覧

抽出元：`src/pages/Mobile/HomePage/MobileHomePage.tsx`（約96行、単一ファイルのコンポーネント）

## 機能要件

1. ページに入ると自動的に `GET /api/articles` をリクエストし、記事一覧を表示する。
2. 3状態の描画：
   - **読み込み中**：全画面中央にぐるぐる回る spinner ＋「読み込み中...」
   - **エラー**：全画面中央に ❌ エラーメッセージ＋「再読み込み」ボタン（`window.location.reload()`）
   - **空一覧**：中央にグレー文字で「記事がありません」
3. 上部固定の header：アプリタイトル（例：「日本語シャドーイング学習」）＋サブタイトル「N 件の記事」。
4. 一覧項目（記事1件につき1行）：
   - 左：44×44 の角丸アイコンブロック（🎧 絵文字のプレースホルダー、カバー画像に差し替え可）
   - 中：タイトル（16px 太字、1行で省略）＋本文先頭行の要約（13px グレー、1行で省略）
   - 右：`›` の矢印
   - 行全体をクリック → `navigate('/m/japanese/all/article/${id}')` で読書ページへ遷移
5. モバイルファースト：白背景、細い区切り線（#f5f5f5）、hover に依存しない。

## 実装の要点

- データ読み込みは [[data-model-and-api]] の loading/error ステートマシンに従う。
- 固定 header：`position: sticky; top: 0; zIndex: 10; borderBottom: 1px solid #f0f0f0`。
- 1行省略の三点セット：`overflow: hidden; textOverflow: ellipsis; whiteSpace: nowrap`、
  かつ中央列のコンテナには `flex: 1; minWidth: 0` が必要（無いと flex の子要素が縮まず省略記号が効かない）。
- spinner は純粋な CSS で実装する：
  ```tsx
  <div style={{ width: 36, height: 36, border: '3px solid #eee',
    borderTopColor: '#333', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  ```

## ビジュアル仕様

| 要素 | 値 |
|------|-----|
| 主色（タイトル文字） | #1a1a2e |
| 補助文字 | #999 / #aaa |
| 区切り線 | #f0f0f0（header）/ #f5f5f5（一覧項目） |
| タイトル文字サイズ | header 22px / 一覧項目 16px |
| 一覧項目の内側余白 | 16px |
