"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import AuthGuard from "@/components/AuthGuard";
import { useAdminAuth } from "@/store/adminAuth";
import { ADMIN_MENU, visibleAdminMenu } from "@/config/adminMenu";

const DRAWER_WIDTH = 220;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, clear } = useAdminAuth();

  // ログイン状態は localStorage（クライアント側のみ）から取得するため、マウント後に関連 UI を描画し SSR ハイドレーションの不一致を防ぐ
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const visibleMenu = visibleAdminMenu(admin?.role);

  // 権限外URLへの直接アクセスをリダイレクトする（UX向上目的。真の防御はバックエンド側）
  // 遷移先は「/admin」固定ではなく本人のロールで見える最初のメニューにする：
  // 「/admin」自体は常に /admin/articles へ転送するため、記事管理権限を持たないロール（USER_ADMINなど）だと無限リダイレクトになってしまう
  useEffect(() => {
    if (!mounted || !admin || pathname === "/admin/login") return;
    const matched = ADMIN_MENU.find((item) => pathname.startsWith(item.href));
    if (matched && !matched.roles.includes(admin.role)) {
      router.replace(visibleAdminMenu(admin.role)[0]?.href ?? "/admin/login");
    }
  }, [mounted, admin, pathname, router]);

  const handleLogout = () => {
    clear();
    router.replace("/admin/login");
  };

  // ログインページでは管理画面のフレームを描画しない
  if (pathname === "/admin/login") {
    return <AuthGuard role="admin">{children}</AuthGuard>;
  }

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            日本語学習 · 管理画面
          </Typography>
          {mounted && admin && (
            <>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {admin.username}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                ログアウト
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <List>
          {visibleMenu.map((item) => (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={pathname.startsWith(item.href)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <AuthGuard role="admin">{children}</AuthGuard>
      </Box>
    </Box>
  );
}
