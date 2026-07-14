"use client";

import { useParams } from "next/navigation";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// 阶段三实现：课程详情（GET /api/user/articles/{id}，富文本 + AudioPlayer）
export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        课程详情 #{id}
      </Typography>
      <Typography color="text.secondary">
        课程详情页面（阶段三实现：正文渲染 + 语音播放器）
      </Typography>
    </Box>
  );
}
