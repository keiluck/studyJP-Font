"use client";

import Box from "@mui/material/Box";

/**
 * 用户端登录/注册独立布局：全屏居中卡片，不套网站框架（AppBar/Container），
 * 与后台登录页形态一致；URL 仍为 /login、/register。
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.100",
        px: 2,
      }}
    >
      {children}
    </Box>
  );
}
