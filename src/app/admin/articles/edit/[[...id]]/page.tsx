"use client";

import { useParams } from "next/navigation";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// 阶段四实现：新增/编辑文章（wangEditor 富文本 dynamic import + 音频上传）
export default function ArticleEditPage() {
  const params = useParams<{ id?: string[] }>();
  const id = params.id?.[0];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {id ? `编辑文章 #${id}` : "新增文章"}
      </Typography>
      <Typography color="text.secondary">
        文章编辑页面（阶段四实现：富文本编辑器 + 封面/音频上传）
      </Typography>
    </Box>
  );
}
