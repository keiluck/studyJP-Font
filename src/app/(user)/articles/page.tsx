"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Pagination from "@mui/material/Pagination";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { fetchArticles } from "@/api/article";
import { fetchCategories } from "@/api/category";
import type { ArticleListItem, PageResult } from "@/types";

const PAGE_SIZE = 10;

const LEVEL_COLOR: Record<string, "success" | "info" | "primary" | "warning" | "error"> = {
  N5: "success",
  N4: "info",
  N3: "primary",
  N2: "warning",
  N1: "error",
};
const levelColor = (level: string) => LEVEL_COLOR[level] ?? "default";

function ArticleList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 絞り込み条件とページング条件は URL クエリを基準とし、リロード後も保持される
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const level = searchParams.get("level") || "";
  const category = searchParams.get("category") || "";

  const [result, setResult] = useState<PageResult<ArticleListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([fetchCategories("ARTICLE_LEVEL"), fetchCategories("ARTICLE_CATEGORY")])
      .then(([levelItems, categoryItems]) => {
        setLevels(levelItems.map((c) => c.value));
        setCategories(categoryItems.map((c) => c.value));
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(
        await fetchArticles({
          page,
          pageSize: PAGE_SIZE,
          level: level || undefined,
          category: category || undefined,
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [page, level, category]);

  useEffect(() => {
    load();
  }, [load]);

  /** URL クエリを更新する（絞り込み条件変更時は1ページ目にリセット） */
  const updateQuery = (patch: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.replace(`/articles?${params.toString()}`);
  };

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 0;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          コース一覧
        </Typography>
        <TextField
          select
          size="small"
          label="レベル"
          value={level}
          onChange={(e) => updateQuery({ level: e.target.value, page: "" })}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">すべて</MenuItem>
          {levels.map((l) => (
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="カテゴリ"
          value={category}
          onChange={(e) => updateQuery({ category: e.target.value, page: "" })}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">すべて</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={load}>
              再試行
            </Button>
          }
        >
          {error}
        </Alert>
      ) : !result || result.list.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
          コースがありません
        </Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            {result.list.map((article) => (
              <Grid item xs={12} sm={6} md={4} key={article.id}>
                <Card sx={{ height: "100%" }}>
                  <CardActionArea
                    sx={{ height: "100%" }}
                    onClick={() => router.push(`/articles/${article.id}`)}
                  >
                    <Box sx={{ position: "relative" }}>
                      {article.coverUrl ? (
                        <Box
                          component="img"
                          src={article.coverUrl}
                          alt={article.title}
                          sx={{ width: "100%", height: 140, objectFit: "cover" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 140,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)",
                            color: "#5c6bc0",
                          }}
                        >
                          <HeadphonesIcon sx={{ fontSize: 48 }} />
                        </Box>
                      )}
                      {article.accessLevel === 1 && (
                        <Chip
                          icon={<WorkspacePremiumIcon />}
                          label="VIP"
                          color="warning"
                          size="small"
                          sx={{ position: "absolute", top: 8, right: 8 }}
                        />
                      )}
                    </Box>
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={article.title}
                      >
                        {article.title}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                        <Chip label={article.level} color={levelColor(article.level)} size="small" />
                        <Typography variant="body2" color="text.secondary">
                          {article.category}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          {article.createdAt.slice(0, 10)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                color="primary"
                onChange={(_, p) => updateQuery({ page: String(p) })}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export default function ArticleListPage() {
  // useSearchParams は Suspense 境界が必要（Next.js の静的プリレンダリングの要件）
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ArticleList />
    </Suspense>
  );
}
