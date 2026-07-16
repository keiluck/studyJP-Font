"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AuthGuard from "@/components/AuthGuard";
import { useUserAuth } from "@/store/userAuth";
import { fetchMe } from "@/api/user";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, clear, setUser } = useUserAuth();

  // ログイン状態は localStorage（クライアント側のみ）から取得するため、マウント後に関連 UI を描画し SSR ハイドレーションの不一致を防ぐ
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // マウント時に token を使って最新のユーザー情報を取得。token が無効な場合はインターセプターが token をクリアしてログインページへ遷移する
  useEffect(() => {
    if (localStorage.getItem("user_token")) {
      fetchMe().then(setUser).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    clear();
    router.replace("/login");
  };

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <MenuBookIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component={Link}
            href="/articles"
            sx={{ color: "inherit", textDecoration: "none" }}
          >
            日本語学習
          </Typography>
          <Button color="inherit" component={Link} href="/articles" sx={{ ml: 3 }}>
            コース
          </Button>
          <Button color="inherit" component={Link} href="/practice">
            問題演習
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          {mounted &&
            (user ? (
              <>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {user.username}
                </Typography>
                <Button color="inherit" onClick={handleLogout}>
                  ログアウト
                </Button>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} href="/login">
                  ログイン
                </Button>
                <Button color="inherit" component={Link} href="/register">
                  新規登録
                </Button>
              </>
            ))}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AuthGuard role="user">{children}</AuthGuard>
      </Container>
    </>
  );
}
