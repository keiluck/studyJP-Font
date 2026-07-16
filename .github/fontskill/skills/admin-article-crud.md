---
name: admin-article-crud
description: 管理側の記事管理ページ——一覧＋新規作成/編集/削除＋音声アップロード。日本語・中国語の2カラムで行単位対訳入力を行う；編集時は sentences[] を1文1行のテキストに復元する；送信時は先に音声をアップロードしてから記事を保存する。
---

# 管理側ページ：記事管理 AdminArticleList

抽出元：`src/pages/Admin/AdminAritcle/AdminArticleList.tsx`（約154行、単一ファイルのコンポーネント）
APIと認証の約束事は [[data-model-and-api]] を参照（管理APIは Bearer token が必要、401では自動的にログインページへ遷移）。

## 機能要件

1. ページに入ると `GET /api/admin/articles` を読み込み、テーブルで表示する：ID、タイトル、音声 URL、作成日時、操作（編集/削除）。
2. 上部の「＋ 新規記事」ボタンでインラインフォームの表示/非表示を切り替える（再クリックで「キャンセル」に変わる）。
3. フォームのフィールド：
   - タイトル（必須の input）
   - **2カラムの textarea（各16行）**：左「本文（日本語全文、1文1行）」、右「中国語訳（日本語と行単位で対応）」
     —— 行単位対訳は利用者側のフォールバック表示のデータソースとなる（読書ページで行単位に対応付けて描画する）
   - 音声ファイルアップロード：`accept=".mp3,.m4a,.wav,.aac,.ogg,audio/*"`、選択後 📁 ファイル名を表示する；
     編集時にファイルを再選択しなかった場合は既存の audioUrl を表示しそのまま使用する
4. 削除：`window.confirm('確認して削除しますか？')` の二段階確認後、成功したらローカルで該当行を除外する（一覧を再取得しない）。
5. 編集：行内の「編集」をクリック → フォームに値を復元 → 送信時は更新APIを呼ぶ。
6. 送信中はボタンを無効化し「保存中...」を表示する；失敗時は `alert` でエラーメッセージを表示する。

## 状態設計

```ts
const [articles, setArticles] = useState<Article[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [submitting, setSubmitting] = useState(false)

// フォーム：editingId が null なら新規作成、null でなければ編集
const [showForm, setShowForm] = useState(false)
const [editingId, setEditingId] = useState<string | null>(null)
const [title, setTitle] = useState('')
const [content, setContent] = useState('')
const [translation, setTranslation] = useState('')
const [audioFile, setAudioFile] = useState<File | null>(null)
const [existingAudioUrl, setExistingAudioUrl] = useState('')  // 編集時に既存の音声を引き継ぐ
```

## 重要ロジック1：編集時の値復元（sentences → 1文1行テキスト）

記事の `content` フィールドには最初の文しか保存されていない場合があり、日本語全文は実際には `sentences[].text` に格納されている。
値の復元時は sentences から1文1行のテキストへ優先的に復元し、訳文との行単位対応を保証する：

```ts
const handleEdit = (article: Article) => {
  setEditingId(article.id)
  setTitle(article.title)
  const hasSentences = article.sentences && article.sentences.length > 0
  setContent(hasSentences ? article.sentences.map(s => s.text).join('\n') : article.content)
  setTranslation(article.translation ??
    (hasSentences ? article.sentences.map(s => s.translation).join('\n') : ''))
  setExistingAudioUrl(article.audioUrl)
  setAudioFile(null)          // 前回選択したファイルをクリアする
  setShowForm(true)
}
```

## 重要ロジック2：送信（先に音声をアップロードし、その後記事を保存する）

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setSubmitting(true)
  try {
    // 新しいファイルを選んだ場合のみアップロードする；それ以外は既存の URL を引き継ぐ（新規作成でファイル未選択の場合は空文字）
    const audioUrl = audioFile ? await uploadAudio(audioFile) : existingAudioUrl

    if (editingId) {
      const updated = await adminUpdateArticle(editingId, { title, content, translation, audioUrl })
      setArticles(prev => prev.map(a => (a.id === editingId ? updated : a)))
    } else {
      const created = await adminCreateArticle({ title, content, translation, audioUrl, sentences: [] })
      setArticles(prev => [...prev, created])
    }
    resetForm()   // フォームを閉じて全フィールドをクリアする
  } catch (err) {
    alert(err instanceof Error ? err.message : '保存に失敗しました')
  } finally {
    setSubmitting(false)
  }
}
```

要点：
- 新規作成時は明示的に `sentences: []` を渡す —— 文単位データ（タイムライン/振り仮名）はバックエンドのパイプラインで別途生成され、フロント側では構築しない。
- 一覧の更新はローカル state の操作（map/filter/append）で行い、操作のたびにテーブル全体を再取得しないようにする。
- アップロード失敗時はそのまま catch に入り、壊れた音声を紐付けた記事が保存されることは無い。

## フォーム/テーブルの骨格

```tsx
<div className="admin-content">
  <div className="admin-content-header">
    <h2>記事管理</h2>
    <button className="add-btn" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
      {showForm ? 'キャンセル' : '+ 新規記事'}
    </button>
  </div>

  {showForm && (
    <form className="question-form" onSubmit={handleSubmit}>
      <label>タイトル <input value={title} required ... /></label>
      <div className="form-row">   {/* 2カラム並び */}
        <label>本文（日本語全文、1文ごとに1行）<textarea rows={16} ... /></label>
        <label>中国語訳（日本語と1行ずつ対応）<textarea rows={16} ... /></label>
      </div>
      <label>音声をアップロード（mp3 / m4a / wav 等）
        <input type="file" accept=".mp3,.m4a,.wav,.aac,.ogg,audio/*" ... />
        {audioFile ? <span>📁 {audioFile.name}</span>
          : existingAudioUrl && <span>📁 {existingAudioUrl}</span>}
      </label>
      <div className="form-footer">
        <button type="button" onClick={resetForm}>キャンセル</button>
        <button type="submit" disabled={submitting}>{submitting ? '保存中...' : '保存'}</button>
      </div>
    </form>
  )}

  {loading ? <p>読み込み中...</p>
    : error ? <p>❌ {error} <button onClick={loadArticles}>再試行</button></p>
    : <table className="admin-table">…（ID/タイトル/音声/作成日時/操作）…</table>}
</div>
```

日付表示：`new Date(a.createdAt).toLocaleDateString('ja-JP')`；音声列が空の場合は `—` を表示する。
