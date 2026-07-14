"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

// 阶段二实现：注册表单（POST /api/user/register）
export default function RegisterPage() {
  return (
    <Paper sx={{ maxWidth: 420, mx: "auto", p: 4 }}>
      <Typography variant="h5" gutterBottom>
        注册
      </Typography>
      <Typography color="text.secondary">注册页面（阶段二实现）</Typography>
    </Paper>
  );
}
