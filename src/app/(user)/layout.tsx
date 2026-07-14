"use client";

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

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, clear } = useUserAuth();

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
            日语学习
          </Typography>
          <Button color="inherit" component={Link} href="/articles" sx={{ ml: 3 }}>
            课程
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          {user ? (
            <>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {user.username}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                退出
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} href="/login">
                登录
              </Button>
              <Button color="inherit" component={Link} href="/register">
                注册
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AuthGuard role="user">{children}</AuthGuard>
      </Container>
    </>
  );
}
