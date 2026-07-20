import adminRequest from "../adminRequest";
import type {
  AdminAccountCreatePayload,
  AdminAccountItem,
  AdminAccountUpdatePayload,
  AdminRole,
} from "@/types/permission";
import type { PageQuery, PageResult } from "@/types";

/**
 * 管理者アカウント管理（SUPER_ADMIN専用）。学習者管理の `api/admin/user.ts` とは別物。
 */
export interface AdminAccountQuery extends PageQuery {
  username?: string;
  role?: AdminRole;
}

export function fetchAdminAccounts(params: AdminAccountQuery): Promise<PageResult<AdminAccountItem>> {
  return adminRequest.get("/api/admin/admins", { params });
}

export function createAdminAccount(data: AdminAccountCreatePayload): Promise<AdminAccountItem> {
  return adminRequest.post("/api/admin/admins", data);
}

export function updateAdminAccount(
  id: number,
  data: AdminAccountUpdatePayload
): Promise<AdminAccountItem> {
  return adminRequest.put(`/api/admin/admins/${id}`, data);
}

export function deleteAdminAccount(id: number): Promise<void> {
  return adminRequest.delete(`/api/admin/admins/${id}`);
}
