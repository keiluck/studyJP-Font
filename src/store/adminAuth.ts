import { create } from "zustand";
import type { AdminInfo } from "@/types";

const TOKEN_KEY = "admin_token";
const ADMIN_KEY = "admin_info";

interface AdminAuthState {
  token: string | null;
  admin: AdminInfo | null;
  setAuth: (token: string, admin: AdminInfo) => void;
  clear: () => void;
}

const isBrowser = typeof window !== "undefined";

function readInitial() {
  if (!isBrowser) return { token: null, admin: null };
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(ADMIN_KEY);
  let admin: AdminInfo | null = null;
  if (raw) {
    try {
      admin = JSON.parse(raw) as AdminInfo;
    } catch {
      localStorage.removeItem(ADMIN_KEY);
    }
  }
  return { token, admin };
}

export const useAdminAuth = create<AdminAuthState>((set) => ({
  ...readInitial(),
  setAuth: (token, admin) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    set({ token, admin });
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    set({ token: null, admin: null });
  },
}));
