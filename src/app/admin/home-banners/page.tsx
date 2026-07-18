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
import { deleteHomeBanner, fetchAdminHomeBanners } from "@/api/admin/homeBanner";
import type { AdminHomeBannerItem } from "@/types/homeBanner";
import type { PageResult } from "@/types";

const PAGE_SIZE = 10;

const formatTime = (s: string) => s?.replace("T", " ").slice(0, 16) || "-";

function HomeBannerManage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const status = searchParams.get("status") || "";

  const [result, setResult] = useState<PageResult<AdminHomeBannerItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminHomeBannerItem | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(
        await fetchAdminHomeBanners({
          page,
          pageSize: PAGE_SIZE,
          status: status === "" ? undefined : Number(status),
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const updateQuery = (patch: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.replace(`/admin/home-banners?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteHomeBanner(deleting.id);
      setToast("バナーを削除しました");
      setDeleting(null);
      await load();
    } catch (e) {
      setToast((e as Error).message);
      setDeleting(null);
    }
  };

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 0;

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }} spacing={2}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          主図バナー管理
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} component={Link} href="/admin/home-banners/edit">
          新規バナー
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          select
          label="状態"
          value={status}
          onChange={(e) => updateQuery({ status: e.target.value, page: "" })}
          sx={{ width: 130 }}
        >
          <MenuItem value="">すべて</MenuItem>
          <MenuItem value="1">有効</MenuItem>
          <MenuItem value="0">無効</MenuItem>
        </TextField>
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
                  <TableCell>画像</TableCell>
                  <TableCell>タイトル</TableCell>
                  <TableCell>タグ</TableCell>
                  <TableCell>リンク種別</TableCell>
                  <TableCell>並び順</TableCell>
                  <TableCell>状態</TableCell>
                  <TableCell>更新日時</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result?.list.map((banner) => (
                  <TableRow key={banner.id} hover>
                    <TableCell>{banner.id}</TableCell>
                    <TableCell>
                      {banner.imageUrl ? (
                        <Box
                          component="img"
                          src={banner.imageUrl}
                          alt=""
                          sx={{ width: 56, height: 36, objectFit: "cover", borderRadius: 1 }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.visibility = "hidden";
                          }}
                        />
                      ) : (
                        <ImageIcon color="disabled" />
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" noWrap title={banner.title}>
                        {banner.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{banner.tag || "-"}</TableCell>
                    <TableCell>{banner.linkType}</TableCell>
                    <TableCell>{banner.sortOrder}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={banner.status === 1 ? "有効" : "無効"}
                        color={banner.status === 1 ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>{formatTime(banner.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        component={Link}
                        href={`/admin/home-banners/edit/${banner.id}`}
                      >
                        編集
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleting(banner)}
                      >
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {result?.list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ color: "text.secondary", py: 4 }}>
                      バナーがありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => updateQuery({ page: String(p) })} />
            </Box>
          )}
        </>
      )}

      <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle>バナーの削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            バナー「{deleting?.title}」を削除してもよろしいですか？（論理削除のため、削除後は即座にトップページから見えなくなります）
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

export default function HomeBannerManagePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <HomeBannerManage />
    </Suspense>
  );
}
