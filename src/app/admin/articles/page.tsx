"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Pagination from "@mui/material/Pagination";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import { deleteArticle, fetchAdminArticles } from "@/api/admin/article";
import type { AdminArticleListItem, ArticleLevel, PageResult } from "@/types";

const PAGE_SIZE = 10;
const LEVELS: ArticleLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const CATEGORIES = ["ニュース", "生活", "文化", "科学"];

const formatTime = (s: string) => s?.replace("T", " ").slice(0, 16) || "-";

function ArticleManage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 絞り込み条件とページング条件は URL クエリを基準とし、リロード後も保持される
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const status = searchParams.get("status") || "";
  const level = searchParams.get("level") || "";
  const category = searchParams.get("category") || "";

  const [result, setResult] = useState<PageResult<AdminArticleListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminArticleListItem | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(
        await fetchAdminArticles({
          page,
          pageSize: PAGE_SIZE,
          status: status === "" ? undefined : Number(status),
          level: level || undefined,
          category: category || undefined,
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [page, status, level, category]);

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
    router.replace(`/admin/articles?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteArticle(deleting.id);
      setToast("記事を削除しました");
      setDeleting(null);
      await load(); // 削除により総ページ数が変わるため再取得する
    } catch (e) {
      setToast((e as Error).message);
      setDeleting(null);
    }
  };

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 0;

  const filterSelect = (
    label: string,
    value: string,
    key: string,
    options: { value: string; label: string }[]
  ) => (
    <TextField
      key={key}
      size="small"
      select
      label={label}
      value={value}
      onChange={(e) => updateQuery({ [key]: e.target.value, page: "" })}
      sx={{ width: 130 }}
    >
      <MenuItem value="">すべて</MenuItem>
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }} spacing={2}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          記事管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/articles/edit"
        >
          新規記事
        </Button>
      </Stack>

      {/* 絞り込み：状態 / レベル / カテゴリ */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {filterSelect("状態", status, "status", [
          { value: "1", label: "公開済み" },
          { value: "0", label: "下書き" },
        ])}
        {filterSelect(
          "レベル",
          level,
          "level",
          LEVELS.map((l) => ({ value: l, label: l }))
        )}
        {filterSelect(
          "カテゴリ",
          category,
          "category",
          CATEGORIES.map((c) => ({ value: c, label: c }))
        )}
      </Stack>

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
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>カバー画像</TableCell>
                  <TableCell>タイトル</TableCell>
                  <TableCell>レベル</TableCell>
                  <TableCell>カテゴリ</TableCell>
                  <TableCell>状態</TableCell>
                  <TableCell>更新日時</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result?.list.map((article) => (
                  <TableRow key={article.id} hover>
                    <TableCell>{article.id}</TableCell>
                    <TableCell>
                      {article.coverUrl ? (
                        <Box
                          component="img"
                          src={article.coverUrl}
                          alt=""
                          sx={{ width: 56, height: 36, objectFit: "cover", borderRadius: 1 }}
                        />
                      ) : (
                        <ImageIcon color="disabled" />
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" noWrap title={article.title}>
                        {article.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{article.level}</TableCell>
                    <TableCell>{article.category}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={article.status === 1 ? "公開済み" : "下書き"}
                        color={article.status === 1 ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>{formatTime(article.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        component={Link}
                        href={`/admin/articles/edit/${article.id}`}
                      >
                        編集
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleting(article)}
                      >
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {result?.list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ color: "text.secondary", py: 4 }}>
                      記事がありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => updateQuery({ page: String(p) })}
              />
            </Box>
          )}
        </>
      )}

      {/* 削除の再確認 */}
      <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle>記事の削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            記事「{deleting?.title}」を削除してもよろしいですか？（論理削除のため、削除後は即座に一般公開ページから見えなくなります）
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>キャンセル</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            削除
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </Box>
  );
}

export default function ArticleManagePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ArticleManage />
    </Suspense>
  );
}
