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
import PeopleIcon from "@mui/icons-material/People";
import ArticleIcon from "@mui/icons-material/Article";
import QuizIcon from "@mui/icons-material/Quiz";
import AuthGuard from "@/components/AuthGuard";
import { useAdminAuth } from "@/store/adminAuth";

const DRAWER_WIDTH = 220;

const MENU = [
  { label: "ユーザー管理", href: "/admin/users", icon: <PeopleIcon /> },
  { label: "記事管理", href: "/admin/articles", icon: <ArticleIcon /> },
  { label: "問題管理", href: "/admin/questions", icon: <QuizIcon /> },
];

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
          {MENU.map((item) => (
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
