"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// 阶段四实现：管理员登录（POST /api/admin/login，token 存 admin_token）
export default function AdminLoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.100",
      }}
    >
      <Paper sx={{ width: 420, p: 4 }}>
        <Typography variant="h5" gutterBottom>
          后台管理登录
        </Typography>
        <Typography color="text.secondary">
          管理员登录页面（阶段四实现）
        </Typography>
      </Paper>
    </Box>
  );
}
