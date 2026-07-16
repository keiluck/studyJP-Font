"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

interface AuthGuardProps {
  role: "user" | "admin";
  children: React.ReactNode;
}

const CONFIG = {
  user: {
    tokenKey: "user_token",
    loginPath: "/login",
    whitelist: ["/login", "/register"],
  },
  admin: {
    tokenKey: "admin_token",
    loginPath: "/admin/login",
    whitelist: ["/admin/login"],
  },
} as const;

/**
 * クライアント側のルートガード。グループ化された layout に配置し、ユーザー側/管理側で共用する。
 * token が無い状態で保護対象ページにアクセスした場合、遷移元パス（redirect）を付けて対応するログインページへリダイレクトし、ログイン後に元のページへ戻れるようにする。
 */
export default function AuthGuard({ role, children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const { tokenKey, loginPath, whitelist } = CONFIG[role];
    if (whitelist.includes(pathname as never)) {
      setAllowed(true);
      return;
    }
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setAllowed(false);
      router.replace(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setAllowed(true);
  }, [role, pathname, router]);

  if (!allowed) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  return <>{children}</>;
}
