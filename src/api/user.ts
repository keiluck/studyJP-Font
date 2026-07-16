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

/** 登録する。成功時はユーザー情報を返す（token は含まれないため、登録後は別途ログインが必要） */
export function register(params: RegisterParams) {
  return request.post<UserInfo>("/api/user/register", params);
}

/** ログインする。token ＋ ユーザー情報を返す */
export function login(params: LoginParams) {
  return request.post<LoginResult>("/api/user/login", params);
}

/** token から現在のユーザー情報を取得する。ログイン状態の更新に使用 */
export function fetchMe() {
  return request.get<UserInfo>("/api/user/me");
}
