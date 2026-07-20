"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
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
import {
  createAdminAccount,
  deleteAdminAccount,
  fetchAdminAccounts,
  updateAdminAccount,
} from "@/api/admin/adminAccount";
import { ADMIN_ROLE_LABEL } from "@/types/permission";
import type { AdminAccountItem, AdminRole } from "@/types/permission";
import type { PageResult } from "@/types";

const PAGE_SIZE = 10;
const ROLE_OPTIONS: AdminRole[] = ["SUPER_ADMIN", "CONTENT_ADMIN", "USER_ADMIN"];

const formatTime = (s: string) => s?.replace("T", " ").slice(0, 16) || "-";

interface AdminFormValues {
  username: string;
  password: string;
  role: AdminRole;
}

/**
 * 管理者アカウント管理（SUPER_ADMIN専用）。学習者管理の /admin/users とは別モジュール。
 * SecurityConfig 側で ADMIN_ROLE_SUPER_ADMIN 以外は /api/admin/admins/** に403になるため、
 * このページ自体も admin/layout.tsx の roles 設定で SUPER_ADMIN 以外には表示・アクセスされない。
 */
function AdminAccountManage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const username = searchParams.get("username") || "";

  const [result, setResult] = useState<PageResult<AdminAccountItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState(username);
  const [toast, setToast] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAccountItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminAccountItem | null>(null);

  const {
    register: field,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminFormValues>();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(
        await fetchAdminAccounts({ page, pageSize: PAGE_SIZE, username: username || undefined })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [page, username]);

  useEffect(() => {
    load();
  }, [load]);

  const updateQuery = (patch: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.replace(`/admin/admins?${params.toString()}`);
  };

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    reset({ username: "", password: "", role: "CONTENT_ADMIN" });
    setFormOpen(true);
  };

  const openEdit = (admin: AdminAccountItem) => {
    setEditing(admin);
    setFormError(null);
    reset({ username: admin.username, password: "", role: admin.role });
    setFormOpen(true);
  };

  const onSubmitForm = async (values: AdminFormValues) => {
    setFormError(null);
    setSubmitting(true);
    try {
      if (editing) {
        const updated = await updateAdminAccount(editing.id, {
          password: values.password || undefined,
          role: values.role,
        });
        setResult((r) =>
          r ? { ...r, list: r.list.map((a) => (a.id === editing.id ? updated : a)) } : r
        );
        setToast("管理者アカウントを更新しました");
      } else {
        await createAdminAccount({ ...values, status: 1 });
        setToast("管理者アカウントを作成しました");
        await load();
      }
      setFormOpen(false);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteAdminAccount(deleting.id);
      setToast("管理者アカウントを削除しました");
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
          管理者アカウント管理
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          新規管理者
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="ユーザー名"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateQuery({ username: keyword, page: "" });
          }}
        />
        <Button variant="outlined" onClick={() => updateQuery({ username: keyword, page: "" })}>
          検索
        </Button>
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
                  <TableCell>ユーザー名</TableCell>
                  <TableCell>ロール</TableCell>
                  <TableCell>状態</TableCell>
                  <TableCell>作成日時</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result?.list.map((admin) => (
                  <TableRow key={admin.id} hover>
                    <TableCell>{admin.id}</TableCell>
                    <TableCell>{admin.username}</TableCell>
                    <TableCell>
                      <Chip size="small" label={ADMIN_ROLE_LABEL[admin.role]} color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={admin.status === 1 ? "有効" : "無効"} color={admin.status === 1 ? "success" : "default"} />
                    </TableCell>
                    <TableCell>{formatTime(admin.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(admin)}>
                        編集
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleting(admin)}>
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {result?.list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 4 }}>
                      管理者アカウントがいません
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

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? `管理者の編集 · ${editing.username}` : "新規管理者"}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmitForm)} noValidate>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {formError && <Alert severity="error">{formError}</Alert>}
              <TextField
                label="ユーザー名"
                disabled={!!editing}
                error={!!errors.username}
                helperText={errors.username?.message}
                {...field("username", { required: editing ? false : "ユーザー名を入力してください" })}
              />
              <TextField
                label={editing ? "パスワード（空欄で変更なし）" : "パスワード"}
                type="password"
                autoComplete="new-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                {...field("password", {
                  required: editing ? false : "パスワードを入力してください",
                  validate: (v) =>
                    (!!editing && !v) || v.length >= 8 || "パスワードは8文字以上で入力してください",
                })}
              />
              <TextField select label="ロール" defaultValue="CONTENT_ADMIN" {...field("role", { required: true })}>
                {ROLE_OPTIONS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {ADMIN_ROLE_LABEL[r]}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setFormOpen(false)}>キャンセル</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "保存中…" : "保存"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle>管理者アカウントの削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            管理者「{deleting?.username}」を削除してもよろしいですか？
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

export default function AdminAccountManagePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <AdminAccountManage />
    </Suspense>
  );
}
