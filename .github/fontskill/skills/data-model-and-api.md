---
name: data-model-and-api
description: 日本語シャドーイング学習システムの中核データモデル（Article/Sentence）とAPIクライアントの約束事（ラップ形式のレスポンス、Bearer token、401処理）。利用者側または管理側のページを実装する前に必読。
---

# データモデルとAPI契約

## 1. 中核データモデル（TypeScript）

```ts
/** 分かち書き単位：振り仮名注記の最小単位 */
export interface RubyWord {
  text: string            // 語の表記（漢字/カタカナ/英数字を含む場合あり）
  ruby?: string           // 振り仮名の読み；仮名のみなど注記不要な語では省略
}

/** 文：シャドーイングの最小単位 */
export interface Sentence {
  id: string
  text: string           // 日本語原文
  translation: string    // 中国語訳
  startTime: number      // 音声内の開始秒
  endTime: number        // 音声内の終了秒
  rubyWords: RubyWord[]  // 分かち書き＋振り仮名注記；未分割の文では空配列
}

/** 記事 */
export interface Article {
  id: string
  title: string
  content: string        // 日本語全文（1文1行のプレーンテキストの場合がある）
  translation?: string   // 中国語全文（content と行単位で対応）
  audioUrl: string       // 音声ファイルの URL
  sentences: Sentence[]  // 文単位データ；管理側で手動入力した記事は空配列の場合がある
  createdAt: string
  updatedAt: string
}

/** バックエンド共通レスポンスのラッパー */
export interface ApiResponse<T> {
  code: number     // 200 = 成功；それ以外は業務エラー
  message: string
  data: T
}
```

**重要な設計**：記事は統一して完全な形態を持つ——`sentences[]` には必ず値があり、タイムラインと `rubyWords`（振り仮名注記、バックエンドの対応付けパイプラインにより生成）を含む。
`content`/`translation` は全文のバックアップフィールドに過ぎず、利用者側の表示とハイライトは一律 `sentences` を基準とする。content/translation の行単位対応付けや文字数によるタイムライン概算へのフォールバックは行わない（この仕組みは廃止済み）。
`rubyWords` が空の文は `text` を文全体でそのまま描画し、振り仮名と背景着色は自動的に無効化される。

## 2. APIクライアントの約束事（axios）

```ts
const apiClient = axios.create({ baseURL: '/api', timeout: 10000 })
export const ADMIN_TOKEN_KEY = 'admin_token'

// リクエストインターセプター：localStorage に token があれば自動的に Authorization ヘッダーを付与する（公開APIではこのヘッダーは無視される）
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// レスポンスインターセプター（2つのルールがあり、どちらも重要）：
// ① バックエンドの業務エラー時も HTTP ステータスは 200 のままで、エラーは body に包まれる（code !== 200、data は null）
//    —— 統一的に rejected Promise へ変換するため、呼び出し側が null データを受け取ることは無い
// ② 実際の HTTP 401（未ログイン/token 期限切れ）→ token をクリアし、管理側のルーティングを /admin/login へ遷移する
apiClient.interceptors.response.use(
  res => {
    const body = res.data as ApiResponse<unknown> | undefined
    if (body && typeof body.code === 'number' && body.code !== 200) {
      return Promise.reject(new Error(body.message || 'リクエストに失敗しました'))
    }
    return res
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)
```

## 3. API一覧

### 公開API（利用者側）
| メソッド | パス | 返り値 |
|------|------|------|
| GET | `/api/articles` | `ApiResponse<Article[]>` 記事一覧 |
| GET | `/api/articles/:id` | `ApiResponse<Article>` 記事詳細 |

### 管理API（Bearer token が必要）
| メソッド | パス | 説明 |
|------|------|------|
| POST | `/api/admin/login` | body `{username, password}` → `data.token`、localStorage に保存 |
| GET | `/api/admin/articles` | 記事一覧 |
| POST | `/api/admin/articles` | 新規作成、body は `Partial<Article>` |
| PUT | `/api/admin/articles/:id` | 更新 |
| DELETE | `/api/admin/articles/:id` | 削除 |
| POST | `/api/upload/audio` | multipart/form-data、フィールド名 `file`、返り値の `data` は音声 URL 文字列 |

### サービス関数の書き方（各APIにつき薄いラッパーを1つ、data を解包する）
```ts
export const getArticles = async (): Promise<Article[]> => {
  const res = await apiClient.get<ApiResponse<Article[]>>('/articles')
  return res.data.data
}
export const uploadAudio = async (file: File): Promise<string> => {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post<ApiResponse<string>>('/upload/audio', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}
```

## 4. ページのデータ読み込みの統一パターン

全てのページで同一の loading/error ステートマシンを使用する：

```ts
const [data, setData] = useState<T | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

const load = async () => {
  try {
    setLoading(true); setError(null)
    setData(await fetchFn())
  } catch (err) {
    setError(err instanceof Error ? err.message : '読み込みに失敗しました')
  } finally {
    setLoading(false)
  }
}
```

描画順序：`loading → ローディングアニメーション` / `error → ❌ メッセージ＋リトライボタン` / `成功 → コンテンツ`。
