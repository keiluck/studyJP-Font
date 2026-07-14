import { create } from "zustand";
import type { UserInfo } from "@/types";

const TOKEN_KEY = "user_token";
const USER_KEY = "user_info";

interface UserAuthState {
  token: string | null;
  user: UserInfo | null;
  /** 登录成功后写入 token 与用户信息（同步持久化到 localStorage） */
  setAuth: (token: string, user: UserInfo) => void;
  /** 更新用户信息（如 /api/user/me 刷新） */
  setUser: (user: UserInfo) => void;
  /** 退出登录 */
  clear: () => void;
}

const isBrowser = typeof window !== "undefined";

function readInitial() {
  if (!isBrowser) return { token: null, user: null };
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(USER_KEY);
  let user: UserInfo | null = null;
  if (raw) {
    try {
      user = JSON.parse(raw) as UserInfo;
    } catch {
      localStorage.removeItem(USER_KEY);
    }
  }
  return { token, user };
}

export const useUserAuth = create<UserAuthState>((set) => ({
  ...readInitial(),
  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },
}));
