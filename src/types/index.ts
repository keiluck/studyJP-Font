/** 后端统一响应格式，由 axios 拦截器解包，业务代码一般只接触 data */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** 分页响应，与后端 PageResult 对齐 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 分页请求基础参数，page 从 1 开始 */
export interface PageQuery {
  page: number;
  pageSize: number;
}

/** 用户信息（user 表，前台） */
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  status: number; // 1=正常 0=禁用
  createdAt: string;
}

/** 管理员信息（admin_user 表） */
export interface AdminInfo {
  id: number;
  username: string;
  status: number;
}

/** 文章等级 */
export type ArticleLevel = "N5" | "N4" | "N3" | "N2" | "N1";

/** 文章列表项（不含正文） */
export interface ArticleListItem {
  id: number;
  title: string;
  level: ArticleLevel;
  category: string;
  coverUrl: string | null;
  createdAt: string;
}

/** 分词单元：假名标注（振り仮名）的最小单位 */
export interface RubyWord {
  text: string; // 词面（可能含汉字/片假名/英数）
  ruby?: string; // 振假名读音；纯假名等无需标注的词省略
}

/** 句子：跟读的最小单位 */
export interface Sentence {
  id: string;
  text: string; // 日语原文
  translation: string; // 中文翻译
  startTime: number; // 在音频中的起始秒
  endTime: number; // 结束秒
  rubyWords?: RubyWord[]; // 分词+假名标注；未分词句子为空
}

/** 文章详情（含正文与音频）。逐句展示与高亮一律以 sentences 为准。 */
export interface ArticleDetail extends ArticleListItem {
  content: string; // 日语全文（备份字段，展示以 sentences 为准）
  translation: string | null; // 中文全文（备份字段）
  status: number; // 0=草稿 1=已发布
  audioUrl: string | null; // 音频 URL
  sentences: Sentence[]; // 逐句数据（含时间轴与假名标注，由后端对齐流水线生成）
}

/** 音频（audio 表） */
export interface AudioItem {
  id: number;
  articleId: number;
  url: string;
  title: string | null;
  sortOrder: number;
}

/** 登录响应（token + 用户信息） */
export interface LoginResult<T = UserInfo> {
  token: string;
  user: T;
}

/** 管理端登录响应（后端 AdminLoginResponse，扁平结构） */
export interface AdminLoginResult {
  token: string;
  id: number;
  username: string;
}

/** 管理端文章列表项（后端 AdminArticleListItem，含状态与更新时间） */
export interface AdminArticleListItem {
  id: number;
  title: string;
  level: ArticleLevel;
  category: string;
  coverUrl: string | null;
  status: number; // 0=草稿 1=已发布
  createdAt: string;
  updatedAt: string;
}

/** 管理端文章详情（后端 ArticleDetailResponse，含正文与音频列表） */
export interface AdminArticleDetail extends AdminArticleListItem {
  content: string; // 富文本 HTML
  audios: AudioItem[];
}

/** 保存文章请求（后端 ArticleSaveRequest，新增/编辑共用） */
export interface ArticleSavePayload {
  title: string;
  content: string;
  level: string;
  category: string;
  coverUrl: string | null;
  status: number; // 0=草稿 1=发布
  audios: { url: string; title: string | null; sortOrder: number }[];
}
