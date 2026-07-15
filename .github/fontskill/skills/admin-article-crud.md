---
name: admin-article-crud
description: 后台文章管理页——列表 + 新建/编辑/删除 + 音频上传。日中双栏逐行对照录入；编辑时把 sentences[] 还原为每句一行文本；提交时先上传音频再保存文章。
---

# 后台页面：文章管理 AdminArticleList

来源：`src/pages/Admin/AdminAritcle/AdminArticleList.tsx`（约 154 行，单文件组件）
接口与鉴权约定见 [[data-model-and-api]]（管理接口需 Bearer token，401 自动跳登录页）。

## 功能需求

1. 进入页面加载 `GET /api/admin/articles`，表格展示：ID、标题、音频 URL、创建时间、操作（编辑/删除）。
2. 顶部「+ 新建文章」按钮切换内联表单显隐（再点变「取消」）。
3. 表单字段：
   - 标题（必填 input）
   - **双栏 textarea（各 16 行）**：左「内容（日语全文，每句一行）」，右「中文翻译（与日文逐行对照）」
     —— 逐行对照是前台降级展示的数据来源（阅读页按行配对渲染）
   - 音频文件上传：`accept=".mp3,.m4a,.wav,.aac,.ogg,audio/*"`，选中后显示 📁 文件名；
     编辑时若未重新选择文件，显示并沿用已有 audioUrl
4. 删除：`window.confirm('确认删除？')` 二次确认，成功后本地过滤掉该行（不重新拉列表）。
5. 编辑：点击行内「编辑」→ 表单回填 → 提交走更新接口。
6. 提交中按钮禁用并显示「保存中...」；失败 `alert` 错误消息。

## 状态设计

```ts
const [articles, setArticles] = useState<Article[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [submitting, setSubmitting] = useState(false)

// 表单：editingId 为 null = 新建，非 null = 编辑
const [showForm, setShowForm] = useState(false)
const [editingId, setEditingId] = useState<string | null>(null)
const [title, setTitle] = useState('')
const [content, setContent] = useState('')
const [translation, setTranslation] = useState('')
const [audioFile, setAudioFile] = useState<File | null>(null)
const [existingAudioUrl, setExistingAudioUrl] = useState('')  // 编辑时沿用旧音频
```

## 关键逻辑 1：编辑回填（sentences → 每句一行文本）

文章的 `content` 字段可能只存了首句，日语全文实际在 `sentences[].text` 中。
回填时优先从 sentences 还原成每句一行，保证与译文逐行对照：

```ts
const handleEdit = (article: Article) => {
  setEditingId(article.id)
  setTitle(article.title)
  const hasSentences = article.sentences && article.sentences.length > 0
  setContent(hasSentences ? article.sentences.map(s => s.text).join('\n') : article.content)
  setTranslation(article.translation ??
    (hasSentences ? article.sentences.map(s => s.translation).join('\n') : ''))
  setExistingAudioUrl(article.audioUrl)
  setAudioFile(null)          // 清掉上次选的文件
  setShowForm(true)
}
```

## 关键逻辑 2：提交（先传音频，再存文章）

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setSubmitting(true)
  try {
    // 选了新文件才上传；否则沿用旧 URL（新建且未选文件时为空串）
    const audioUrl = audioFile ? await uploadAudio(audioFile) : existingAudioUrl

    if (editingId) {
      const updated = await adminUpdateArticle(editingId, { title, content, translation, audioUrl })
      setArticles(prev => prev.map(a => (a.id === editingId ? updated : a)))
    } else {
      const created = await adminCreateArticle({ title, content, translation, audioUrl, sentences: [] })
      setArticles(prev => [...prev, created])
    }
    resetForm()   // 关表单并清空所有字段
  } catch (err) {
    alert(err instanceof Error ? err.message : '保存失败')
  } finally {
    setSubmitting(false)
  }
}
```

要点：
- 新建时显式传 `sentences: []` —— 逐句数据（时间轴/注音）由后端流水线另行生成，前端不构造。
- 列表更新用本地 state 操作（map/filter/append），避免每次操作后整表刷新。
- 上传失败会直接进 catch，不会保存一篇挂着坏音频的文章。

## 表单/表格骨架

```tsx
<div className="admin-content">
  <div className="admin-content-header">
    <h2>文章管理</h2>
    <button className="add-btn" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
      {showForm ? '取消' : '+ 新建文章'}
    </button>
  </div>

  {showForm && (
    <form className="question-form" onSubmit={handleSubmit}>
      <label>标题 <input value={title} required ... /></label>
      <div className="form-row">   {/* 双栏并排 */}
        <label>内容（日语全文，每句一行）<textarea rows={16} ... /></label>
        <label>中文翻译（与日文逐行对照）<textarea rows={16} ... /></label>
      </div>
      <label>上传音频（mp3 / m4a / wav 等）
        <input type="file" accept=".mp3,.m4a,.wav,.aac,.ogg,audio/*" ... />
        {audioFile ? <span>📁 {audioFile.name}</span>
          : existingAudioUrl && <span>📁 {existingAudioUrl}</span>}
      </label>
      <div className="form-footer">
        <button type="button" onClick={resetForm}>取消</button>
        <button type="submit" disabled={submitting}>{submitting ? '保存中...' : '保存'}</button>
      </div>
    </form>
  )}

  {loading ? <p>加载中...</p>
    : error ? <p>❌ {error} <button onClick={loadArticles}>重试</button></p>
    : <table className="admin-table">…（ID/标题/音频/创建时间/操作）…</table>}
</div>
```

日期展示：`new Date(a.createdAt).toLocaleDateString('zh-CN')`；音频列空值显示 `—`。
