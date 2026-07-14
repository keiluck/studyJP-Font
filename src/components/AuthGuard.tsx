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
 * 客户端路由守卫，挂在分组 layout 上，用户端/管理端复用。
 * 无 token 访问受保护页面时重定向到对应登录页，并携带来源路径（redirect）供登录后跳回。
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
