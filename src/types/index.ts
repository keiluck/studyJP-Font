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

/** 文章详情（含正文与音频列表） */
export interface ArticleDetail extends ArticleListItem {
  content: string; // 富文本 HTML，后端已做 XSS 过滤
  status: number; // 0=草稿 1=已发布
  audios: AudioItem[];
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
