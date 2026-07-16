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

/** 記事一覧（ページング＋レベル/カテゴリ絞り込み） */
export function fetchArticles(
  params: ArticleQuery
): Promise<PageResult<ArticleListItem>> {
  return request.get("/api/user/articles", { params });
}

/** 記事詳細（リッチテキスト本文＋音声一覧） */
export function fetchArticleDetail(id: number): Promise<ArticleDetail> {
  return request.get(`/api/user/articles/${id}`);
}
