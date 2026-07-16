---
name: mobile-reader-page
description: モバイル端利用者側の読書ページ——文単位でシャドーイングするページ。文単位の描画（振り仮名注記＋ハイライト文の背景着色）、下部固定プレイヤー（速度変更/振り仮名切り替え/翻訳モード/集中リスニング）、再生ハイライトの追従。
---

# 利用者側読書ページ：文単位シャドーイング（振り仮名と背景着色を含む）

抽出元：`src/pages/Mobile/ReaderPage/MobileReaderPage.tsx` + `src/components/Mobile/SentenceItem/MobileSentenceItem.tsx` + `src/components/Mobile/AudioPlayer/MobileAudioPlayer.tsx`

## 機能要件

1. ページに入ると `GET /api/articles/:id` をリクエストし、カバー画像＋タイトル＋日付（`ja-JP` locale）＋文単位の一覧を表示する。
2. **文単位の描画**（SentenceItem）：日本語原文＋中国語訳、翻訳の3状態（always / click / hidden）。
3. **振り仮名注記**：
   - 文に `rubyWords`（[[data-model-and-api]] を参照）がある場合は語ごとに描画する：`w.ruby && showRuby` の場合は `<ruby><span>{w.text}</span><rt>{w.ruby}</rt></ruby>`、それ以外は `<span>{w.text}</span>`；
   - `showRuby` のグローバルスイッチはページ側が保持し、プレイヤーのツールバーにある「あ カタカナ」ボタンで切り替える（オフの時はボタンがグレー＋取り消し線になる）；
   - `rubyWords` が空（未分割）の場合は文全体を `text` としてそのまま描画する。
4. **背景着色（品詞着色）**：現在再生中の文（isActive）内のみ着色し、語ごとに種類分けする：
   ```ts
   const typeColor = { han: '#ffb74d', katakana: '#4fc3f7', en: '#aed581', other: 'transparent' }
   const getWordType = (text: string) => {
     if (/\p{Script=Han}/u.test(text)) return 'han'        // 漢字：オレンジ
     if (/[゠-ヿ]/.test(text)) return 'katakana'   // カタカナ：青
     if (/[A-Za-z0-9]/.test(text)) return 'en'             // 英数字：緑
     return 'other'
   }
   ```
   語のブロックスタイルは `borderRadius: 4; padding: 1px 4px; display: inline-block`。
5. **再生ハイライトの追従**：`timeupdate` で `startTime`/`endTime` から現在時刻に該当する文を探し → ハイライト（薄い青の背景 `#f0f7ff`）し `scrollIntoView({ block: 'center' })` する；文をクリックするとその文の `startTime` にジャンプして再生する。文単位のデータは `sentences` を基準とし（[[data-model-and-api]] を参照）、タイムラインが無い場合の概算フォールバックは行わない。
6. **下部固定プレイヤー**：進捗バー（ドラッグ中は seek せず、離した時のみ seek する）、±10秒/±30秒、再生/一時停止、ツールバー4ボタン —— スピード（7段階の速度変更 bottom-sheet）/ カタカナ（振り仮名切り替え）/ リスニング（集中リスニング）/ 通訳（翻訳モード bottom-sheet）。
7. **集中リスニングモード**：全画面の単文カード（進捗バッジ n/N）、2秒巻き戻し、前/次の文へジャンプ再生、テキスト非表示での聴き取り練習；カード内でも振り仮名は描画するが、**背景着色は行わない**。

## 実装の要点

- 全てのツールバー状態（showRuby / speed / translationMode / listeningMode / showText）はページ側が保持し、プレイヤーは制御コンポーネントとする。
- `audio.play().catch(...)`：モバイル端末の自動再生ポリシーにより拒否される場合があるため、必ずキャッチすること。
- 振り仮名表示時は文の `lineHeight` を広げ（一覧は 2.2、リスニングカードは 2.4）、`<rt>` 用のスペースを確保する。
- 2つのモードで同一の `<audio>` を共用し（プレイヤーはマウントされたまま維持する）、モード切り替え時に音声が中断しないようにする。

## ビジュアル仕様

| 要素 | 値 |
|------|-----|
| 原文の文字サイズ/行高 | 18px / 2.2（振り仮名あり）、1.8（振り仮名なし）；リスニングカードは 20–22px |
| 振り仮名 `<rt>` | 10–11px、#888 |
| 翻訳 | 13px、#888、opacity トランジション（click モード切り替え時にガタつかない） |
| ハイライト文の背景 | #f0f7ff |
| 品詞着色 | 漢字 #ffb74d / カタカナ #4fc3f7 / 英数字 #aed581 |
