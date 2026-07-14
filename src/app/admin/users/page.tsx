"use client";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// 阶段四实现：用户管理（列表/新增/编辑/软删除/启用禁用）
export default function UserManagePage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        用户管理
      </Typography>
      <Typography color="text.secondary">
        用户管理页面（阶段四实现：分页列表 + 增删改 + 状态切换）
      </Typography>
    </Box>
  );
}
