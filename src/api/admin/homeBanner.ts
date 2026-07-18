import adminRequest from "../adminRequest";
import type { AdminHomeBannerItem, HomeBannerSavePayload } from "@/types/homeBanner";
import type { PageQuery, PageResult } from "@/types";

export interface AdminHomeBannerQuery extends PageQuery {
  status?: number; // 0=無効 1=有効
}

export function fetchAdminHomeBanners(
  params: AdminHomeBannerQuery
): Promise<PageResult<AdminHomeBannerItem>> {
  return adminRequest.get("/api/admin/home-banners", { params });
}

export function fetchAdminHomeBannerDetail(id: number): Promise<AdminHomeBannerItem> {
  return adminRequest.get(`/api/admin/home-banners/${id}`);
}

export function createHomeBanner(data: HomeBannerSavePayload): Promise<AdminHomeBannerItem> {
  return adminRequest.post("/api/admin/home-banners", data);
}

export function updateHomeBanner(
  id: number,
  data: HomeBannerSavePayload
): Promise<AdminHomeBannerItem> {
  return adminRequest.put(`/api/admin/home-banners/${id}`, data);
}

export function deleteHomeBanner(id: number): Promise<void> {
  return adminRequest.delete(`/api/admin/home-banners/${id}`);
}
