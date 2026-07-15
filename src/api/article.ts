import request from "./request";
import type {
  ArticleDetail,
  ArticleListItem,
  PageQuery,
  PageResult,
} from "@/types";

export interface ArticleQuery extends PageQuery {
  level?: string;
  category?: string;
}

/** 文章列表（分页 + 等级/分类筛选） */
export function fetchArticles(
  params: ArticleQuery
): Promise<PageResult<ArticleListItem>> {
  return request.get("/api/user/articles", { params });
}

/** 文章详情（富文本正文 + 音频列表） */
export function fetchArticleDetail(id: number): Promise<ArticleDetail> {
  return request.get(`/api/user/articles/${id}`);
}
