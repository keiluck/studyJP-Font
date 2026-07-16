---
name: verify
description: 本プロジェクト（Next.js フロントエンド）の動作検証方法：起動、ブラウザ操作、よくある落とし穴
---

# studyJP-Font 動作検証

## 起動

- バックエンドを先に 8080 番で起動しておくこと（`curl http://localhost:8080/api/health` が 200 を返すはず）。Next.js は rewrites で `/api` と `/uploads` をプロキシする。
- フロントエンド：`npm run dev`（バックグラウンド実行）。起動完了の判定：`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login` が 200 を返すこと。

## ブラウザ操作（プロジェクト内に Playwright 依存を持たない）

Playwright は npx キャッシュにインストールされているため、スクリプトでは絶対パスで参照する。

```js
const { chromium } = require("/Users/lany/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");
```

（パスが無効になった場合は `find ~/.npm/_npx -maxdepth 3 -name playwright -type d` で再特定する。）

再利用可能な一連のフローのスクリプトテンプレート（登録→ログイン→リロード→ログアウト→ガード→両端隔離）は過去セッションの scratchpad にある `e2e-auth.js` を参照。要点：

- MUI TextField は `getByLabel("ユーザー名")` で取得する。登録ページの「パスワード」は「パスワード確認」と区別するため `{ exact: true }` が必要。
- **`getByRole("alert")` でエラー表示を断定しないこと**——Next.js の route-announcer（同じく role=alert）を誤って捕捉してしまう。`page.waitForSelector(".MuiAlert-message")` ＋ `textContent` を使うこと。
- テストアカウントはタイムスタンプで生成する（`e2e${Date.now()}`）。バックエンドの MySQL に実際に登録される。

## 落とし穴

- **dev server 実行中に `npm run build` を実行しないこと**：両者は `.next` ディレクトリを共用しており、dev のキャッシュを壊してしまう（ページのリソースが全て 500 になる）。復旧方法：dev を停止 → `rm -rf .next` → dev を再起動。build による検証が必要な場合は先に dev server を停止すること。
- **dev server 停止後、ポートが本当に解放されたか確認すること**：TaskStop/kill で `npm run dev` のラッパープロセスを停止しても、`next-server` の子プロセスが残って 3000 番を占有し続けることがある（新しい dev はサイレントに 3001 番に落ち、残存プロセスは `.next` が削除されているためリソースが 404/500 になる）。起動前に毎回 `lsof -ti :3000 | xargs kill` でクリアし、dev のログで実際のポートを確認すること。
- 初回アクセス時のルートは dev のコンパイルが遅いため、アサーションのタイムアウトは 30 秒程度余裕を持たせること。

## 検証する価値のあるフロー

- 読書ページの文と音声の同期：`/articles/1` で n 番目の文をクリックすると `audio.currentTime` がその文の `startTime` と一致するはずで、該当する時間帯を再生中はその文がハイライトされること。mock 音声 `public/audio/001.mp3`（実際は M4A コンテナ）の音声内容は「自己紹介」の4文で、mock の文と一対一で対応している。

- 認証の一連の流れ：未ログイン状態で `/articles` にアクセスすると遮断される → 登録（自動ログイン）→ リロードしてもログイン状態が保持される → ログアウト → 再度遮断される。
- ログインページでパスワードを間違えた場合：ログインページに留まりバックエンドの message が表示されること（インターセプターはログインページの 401 について特別扱いをしている）。
- 両端隔離：user_token を持った状態で `/admin/**` にアクセスすると `/admin/login` に遮断されること。
