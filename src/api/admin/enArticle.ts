import adminRequest from "../adminRequest";
import type {
  AdminEnArticleDetail,
  AdminEnArticleListItem,
  EnArticleSavePayload,
} from "@/types/enArticle";
import type { PageQuery, PageResult } from "@/types";

export interface AdminEnArticleQuery extends PageQuery {
  status?: number; // 0=下書き 1=公開済み
  level?: string;
  category?: string;
}

export function fetchAdminEnArticles(
  params: AdminEnArticleQuery
): Promise<PageResult<AdminEnArticleListItem>> {
  return adminRequest.get("/api/admin/en-articles", { params });
}

export function fetchAdminEnArticleDetail(id: number): Promise<AdminEnArticleDetail> {
  return adminRequest.get(`/api/admin/en-articles/${id}`);
}

export function createEnArticle(data: EnArticleSavePayload): Promise<AdminEnArticleDetail> {
  return adminRequest.post("/api/admin/en-articles", data);
}

export function updateEnArticle(
  id: number,
  data: EnArticleSavePayload
): Promise<AdminEnArticleDetail> {
  return adminRequest.put(`/api/admin/en-articles/${id}`, data);
}

export function deleteEnArticle(id: number): Promise<void> {
  return adminRequest.delete(`/api/admin/en-articles/${id}`);
}
