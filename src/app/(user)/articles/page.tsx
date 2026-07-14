"use client";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// 阶段三实现：课程列表（GET /api/user/articles，等级/分类筛选 + 分页）
export default function ArticleListPage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        课程列表
      </Typography>
      <Typography color="text.secondary">
        课程列表页面（阶段三实现：筛选 + 分页 + 卡片展示）
      </Typography>
    </Box>
  );
}
