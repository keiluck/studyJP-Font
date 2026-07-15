import request from "./request";
import type {
  ArticleDetail,
  ArticleListItem,
  PageQuery,
  PageResult,
} from "@/types";
import { mockFetchArticleDetail, mockFetchArticles } from "./mock/article";

// TODO: mock —— 后端阶段三接口就绪后置为 false 并删除 src/api/mock/
const USE_MOCK = true;

export interface ArticleQuery extends PageQuery {
  level?: string;
  category?: string;
}

/** 文章列表（分页 + 等级/分类筛选） */
export function fetchArticles(
  params: ArticleQuery
): Promise<PageResult<ArticleListItem>> {
  if (USE_MOCK) return mockFetchArticles(params);
  return request.get("/api/user/articles", { params });
}

/** 文章详情（含句子数据与音频） */
export function fetchArticleDetail(id: number): Promise<ArticleDetail> {
  if (USE_MOCK) return mockFetchArticleDetail(id);
  return request.get(`/api/user/articles/${id}`);
}
