# copyskill — 日本語シャドーイング学習システム フロントエンド機能抽出ドキュメント

本ディレクトリは proFont プロジェクトの2つのページ群から再利用可能な **agents** と **skills** を抽出したものであり、
別システム上で同種の機能（言語シャドーイング学習アプリの利用者側＋管理側）を再現するために使用する。

抽出元コード：
- 利用者側（モバイル端）：`src/pages/Mobile/`（HomePage、ReaderPage）とその依存コンポーネント
- 管理側（管理端）：`src/pages/Admin/AdminAritcle/`（AdminArticleList）

## ディレクトリ構成

```
copyskill/
├── README.md                        # 本ファイル（インデックス）
├── agents/
│   └── admin-article-agent.md       # 管理側の記事管理を構築する Agent
└── skills/
    ├── data-model-and-api.md        # データモデル＋API契約（利用者側・管理側共通、まずこれを読む）
    ├── mobile-home-list.md          # 利用者側：記事一覧ホームページ
    ├── mobile-reader-page.md        # 利用者側：文単位でシャドーイングする読書ページ（振り仮名注記＋背景着色＋プレイヤー）
    └── admin-article-crud.md        # 管理側：記事 CRUD ＋音声アップロード
```

## 使い方

1. 本ディレクトリを対象プロジェクトの `.claude/` 配下にコピーする（agents → `.claude/agents/`、skills → `.claude/skills/<name>/SKILL.md`）、
   または要件/設計ドキュメントとしてそのまま開発者に渡す。
2. まず `skills/data-model-and-api.md` を読みデータ構造とAPI仕様を確定させ、その後 agent ドキュメントに従ってページごとに実装する。
3. ドキュメント内のコード片は React 18 + TypeScript + react-router-dom + axios を前提としており、
   スタイルはインライン style（モバイル端）/ CSS class（管理側）を使用している。対象システムの技術スタックに合わせて置き換えてよい。

## 機能概要

| モジュール | 機能ポイント |
|------|--------|
| 利用者側ホームページ | 記事一覧、ロード中/エラー/空状態、クリックで読書ページへ遷移 |
| 利用者側読書ページ | 文単位の描画、振り仮名注記（振り仮名の表示/非表示）、ハイライトされた文の品詞背景着色、プレイヤー（速度変更/翻訳モード/集中リスニング） |
| 管理側記事管理 | 一覧、新規作成/編集/削除、日本語・中国語の行単位対訳入力、音声ファイルアップロード |
| APIレイヤー | axios インスタンス、Bearer token インターセプター、ラップ形式のレスポンス（HTTP 200 ＋ body.code）を統一的に例外へ変換、401でログインページへ遷移 |
