---
name: data-model-and-api
description: 日语跟读学习系统的核心数据模型（Article/Sentence）与 API 客户端约定（包裹式响应、Bearer token、401 处理）。实现任何前台或后台页面前必读。
---

# 数据模型与 API 契约

## 1. 核心数据模型（TypeScript）

```ts
/** 分词单元：假名标注（振り仮名）的最小单位 */
export interface RubyWord {
  text: string            // 词面（可能含汉字/片假名/英数）
  ruby?: string           // 振假名读音；纯假名等无需标注的词省略
}

/** 句子：跟读的最小单位 */
export interface Sentence {
  id: string
  text: string           // 日语原文
  translation: string    // 中文翻译
  startTime: number      // 在音频中的起始秒
  endTime: number        // 在音频中的结束秒
  rubyWords: RubyWord[]  // 分词+假名标注；未分词句子为空数组
}

/** 文章 */
export interface Article {
  id: string
  title: string
  content: string        // 日语全文（可能是每句一行的纯文本）
  translation?: string   // 中文全文（与 content 逐行对照）
  audioUrl: string       // 音频文件 URL
  sentences: Sentence[]  // 逐句数据；后台手工录入的文章可能为空数组
  createdAt: string
  updatedAt: string
}

/** 后端统一响应包装 */
export interface ApiResponse<T> {
  code: number     // 200 = 成功；其他值表示业务错误
  message: string
  data: T
}
```

**关键设计**：文章统一为完整形态——`sentences[]` 必有值，含时间轴与 `rubyWords` 分词假名标注（由后端对齐流水线生成）。
`content`/`translation` 仅为全文备份字段，前台展示与高亮一律以 `sentences` 为准；不做 content/translation 逐行配对与按字数估算时间轴的降级（该机制已移除）。
`rubyWords` 为空的句子整句渲染 `text`，假名与背景标注自动失效。

## 2. API 客户端约定（axios）

```ts
const apiClient = axios.create({ baseURL: '/api', timeout: 10000 })
export const ADMIN_TOKEN_KEY = 'admin_token'

// 请求拦截：localStorage 有 token 就自动带 Authorization 头（公开接口忽略该头）
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截（两条规则，都很重要）：
// ① 后端业务异常时 HTTP 状态仍为 200，错误包在 body 里（code !== 200，data 为 null）
//    —— 统一转成 rejected Promise，调用方永远不会拿到 null 数据
// ② 真实 HTTP 401（未登录/token 过期）→ 清 token，管理端路由跳转 /admin/login
apiClient.interceptors.response.use(
  res => {
    const body = res.data as ApiResponse<unknown> | undefined
    if (body && typeof body.code === 'number' && body.code !== 200) {
      return Promise.reject(new Error(body.message || '请求失败'))
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

## 3. 接口清单

### 公开接口（前台）
| 方法 | 路径 | 返回 |
|------|------|------|
| GET | `/api/articles` | `ApiResponse<Article[]>` 文章列表 |
| GET | `/api/articles/:id` | `ApiResponse<Article>` 文章详情 |

### 管理接口（需 Bearer token）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/login` | body `{username, password}` → `data.token`，存 localStorage |
| GET | `/api/admin/articles` | 文章列表 |
| POST | `/api/admin/articles` | 新建，body 为 `Partial<Article>` |
| PUT | `/api/admin/articles/:id` | 更新 |
| DELETE | `/api/admin/articles/:id` | 删除 |
| POST | `/api/upload/audio` | multipart/form-data，字段名 `file`，返回 `data` 为音频 URL 字符串 |

### 服务函数写法（每个接口一个薄封装，解包 data）
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

## 4. 页面数据加载统一模式

所有页面用同一套 loading/error 状态机：

```ts
const [data, setData] = useState<T | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

const load = async () => {
  try {
    setLoading(true); setError(null)
    setData(await fetchFn())
  } catch (err) {
    setError(err instanceof Error ? err.message : '加载失败')
  } finally {
    setLoading(false)
  }
}
```

渲染顺序：`loading → 转圈动画` / `error → ❌ 消息 + 重试按钮` / `成功 → 内容`。
