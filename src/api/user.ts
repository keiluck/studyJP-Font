import request from "./request";
import type { LoginResult, UserInfo } from "@/types";

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

/** 注册，成功返回用户信息（不含 token，注册后需登录） */
export function register(params: RegisterParams) {
  return request.post<UserInfo>("/api/user/register", params);
}

/** 登录，返回 token + 用户信息 */
export function login(params: LoginParams) {
  return request.post<LoginResult>("/api/user/login", params);
}

/** token 换当前用户信息，供刷新登录态 */
export function fetchMe() {
  return request.get<UserInfo>("/api/user/me");
}
