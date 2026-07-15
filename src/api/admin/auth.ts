import adminRequest from "../adminRequest";
import type { AdminLoginResult } from "@/types";

export interface AdminLoginParams {
  username: string;
  password: string;
}

/** 管理员登录，token 由页面存入 admin_token */
export function adminLogin(params: AdminLoginParams): Promise<AdminLoginResult> {
  return adminRequest.post("/api/admin/login", params);
}
