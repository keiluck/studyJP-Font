import request from "./request";
import type { EnArticleDetail, EnArticleListItem } from "@/types/enArticle";
import type { PageQuery, PageResult } from "@/types";

export interface EnArticleQuery extends PageQuery {
  level?: string;
  category?: string;
}

/** 英語記事一覧（ページング＋レベル/カテゴリ絞り込み） */
export function fetchEnArticles(
  params: EnArticleQuery
): Promise<PageResult<EnArticleListItem>> {
  return request.get("/api/user/en-articles", { params });
}

/** 英語記事詳細（リッチテキスト本文＋音声一覧＋単語表） */
export function fetchEnArticleDetail(id: number): Promise<EnArticleDetail> {
  return request.get(`/api/user/en-articles/${id}`);
}
