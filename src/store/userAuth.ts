import { create } from "zustand";
import type { UserInfo } from "@/types";

const TOKEN_KEY = "user_token";
const USER_KEY = "user_info";

interface UserAuthState {
  token: string | null;
  user: UserInfo | null;
  /** ログイン成功後に token とユーザー情報を書き込む（同時に localStorage へ永続化） */
  setAuth: (token: string, user: UserInfo) => void;
  /** ユーザー情報を更新する（/api/user/me での再取得など） */
  setUser: (user: UserInfo) => void;
  /** ログアウトする */
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
