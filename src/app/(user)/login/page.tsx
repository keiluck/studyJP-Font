"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

// 阶段二实现：登录表单（POST /api/user/login）
export default function LoginPage() {
  return (
    <Paper sx={{ maxWidth: 420, mx: "auto", p: 4 }}>
      <Typography variant="h5" gutterBottom>
        登录
      </Typography>
      <Typography color="text.secondary">登录页面（阶段二实现）</Typography>
    </Paper>
  );
}
