import adminRequest from "../adminRequest";
import type { PageQuery, PageResult, UserInfo } from "@/types";

export interface UserQuery extends PageQuery {
  username?: string; // 用户名模糊搜索
  status?: number; // 1=正常 0=禁用
}

export interface UserCreatePayload {
  username: string;
  email: string;
  password: string;
  status: number;
}

/** 编辑时密码留空表示不修改 */
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
