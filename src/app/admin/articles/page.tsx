"use client";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// 阶段四实现：文章管理（草稿/已发布筛选 + 分页 + 软删除）
export default function ArticleManagePage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        文章管理
      </Typography>
      <Typography color="text.secondary">
        文章管理页面（阶段四实现：状态筛选 + 分页列表）
      </Typography>
    </Box>
  );
}
