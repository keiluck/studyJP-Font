import adminRequest from "../adminRequest";
import type {
  AdminArticleDetail,
  AdminArticleListItem,
  ArticleSavePayload,
  PageQuery,
  PageResult,
} from "@/types";

export interface AdminArticleQuery extends PageQuery {
  status?: number; // 0=草稿 1=已发布
  level?: string;
  category?: string;
}

export function fetchAdminArticles(
  params: AdminArticleQuery
): Promise<PageResult<AdminArticleListItem>> {
  return adminRequest.get("/api/admin/articles", { params });
}

export function fetchAdminArticleDetail(id: number): Promise<AdminArticleDetail> {
  return adminRequest.get(`/api/admin/articles/${id}`);
}

export function createArticle(data: ArticleSavePayload): Promise<AdminArticleDetail> {
  return adminRequest.post("/api/admin/articles", data);
}

export function updateArticle(
  id: number,
  data: ArticleSavePayload
): Promise<AdminArticleDetail> {
  return adminRequest.put(`/api/admin/articles/${id}`, data);
}

export function deleteArticle(id: number): Promise<void> {
  return adminRequest.delete(`/api/admin/articles/${id}`);
}
