import adminRequest from "../adminRequest";
import type { AdminLoginResult } from "@/types";

export interface AdminLoginParams {
  username: string;
  password: string;
}

/** 管理者ログイン。token はページ側で admin_token に保存する */
export function adminLogin(params: AdminLoginParams): Promise<AdminLoginResult> {
  return adminRequest.post("/api/admin/login", params);
}
