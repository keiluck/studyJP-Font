"use client";

import Box from "@mui/material/Box";

/**
 * ユーザー側のログイン/登録専用レイアウト：全画面中央のカード表示で、サイト共通のフレーム（AppBar/Container）は使用しない。
 * 管理画面のログインページと同じ形態。URL は /login、/register のまま。
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
