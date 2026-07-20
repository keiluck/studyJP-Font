import adminRequest from "../adminRequest";
import type { PageQuery, PageResult, UserInfo } from "@/types";

export interface UserQuery extends PageQuery {
  username?: string; // ユーザー名のあいまい検索
  status?: number; // 1=有効 0=無効
}

export interface UserCreatePayload {
  username: string;
  email: string;
  password: string;
  status: number;
}

/** 編集時にパスワードを空欄にすると変更しないことを意味する */
export interface UserUpdatePayload {
  email: string;
  password?: string;
  status: number;
}

export function fetchUsers(params: UserQuery): Promise<PageResult<UserInfo>> {
  return adminRequest.get("/api/admin/users", { params });
}

export function createUser(data: UserCreatePayload): Promise<UserInfo> {
  return adminRequest.post("/api/admin/users", data);
}

export function updateUser(id: number, data: UserUpdatePayload): Promise<UserInfo> {
  return adminRequest.put(`/api/admin/users/${id}`, data);
}

export function deleteUser(id: number): Promise<void> {
  return adminRequest.delete(`/api/admin/users/${id}`);
}

export function updateUserStatus(id: number, status: number): Promise<void> {
  return adminRequest.put(`/api/admin/users/${id}/status`, { status });
}

/** VIP設定（フェーズ9）。vipExpireAt に null または過去日時を渡すとVIP解除 */
export function updateUserVip(id: number, vipExpireAt: string | null): Promise<void> {
  return adminRequest.put(`/api/admin/users/${id}/vip`, { vipExpireAt });
}
