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
import Switch from "@mui/material/Switch";
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
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
  updateUserStatus,
} from "@/api/admin/user";
import type { PageResult, UserInfo } from "@/types";

const PAGE_SIZE = 10;

const formatTime = (s: string) => s?.replace("T", " ").slice(0, 16) || "-";

/** 新規作成/編集で共用するフォームの値。編集時は username を読み取り専用にし、password を空欄にすると変更しないことを意味する */
interface UserFormValues {
  username: string;
  email: string;
  password: string;
}

function UserManage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 絞り込み条件とページング条件は URL クエリを基準とし、リロード後も保持される
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const username = searchParams.get("username") || "";
  const status = searchParams.get("status") || "";

  const [result, setResult] = useState<PageResult<UserInfo> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState(username); // 検索ボックスの入力値（Enter/検索クリックで反映される）
  const [toast, setToast] = useState<string | null>(null);

  // Dialog の状態：新規作成/編集で共用し、editing が null なら新規作成を意味する
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<UserInfo | null>(null);

  const {
    register: field,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(
        await fetchUsers({
          page,
          pageSize: PAGE_SIZE,
          username: username || undefined,
          status: status === "" ? undefined : Number(status),
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [page, username, status]);

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
    router.replace(`/admin/users?${params.toString()}`);
  };

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    reset({ username: "", email: "", password: "" });
    setFormOpen(true);
  };

  const openEdit = (user: UserInfo) => {
    setEditing(user);
    setFormError(null);
    reset({ username: user.username, email: user.email, password: "" });
    setFormOpen(true);
  };

  const onSubmitForm = async (values: UserFormValues) => {
    setFormError(null);
    setSubmitting(true);
    try {
      if (editing) {
        const updated = await updateUser(editing.id, {
          email: values.email,
          password: values.password || undefined,
          status: editing.status,
        });
        // ローカルでリストを更新し、テーブル全体は再取得しない
        setResult((r) =>
          r
            ? { ...r, list: r.list.map((u) => (u.id === editing.id ? updated : u)) }
            : r
        );
        setToast("ユーザーを更新しました");
      } else {
        await createUser({ ...values, status: 1 });
        setToast("ユーザーを作成しました");
        await load(); // 新規作成により総ページ数が変わるため、現在のページを再取得する
      }
      setFormOpen(false);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserInfo) => {
    const next = user.status === 1 ? 0 : 1;
    try {
      await updateUserStatus(user.id, next);
      setResult((r) =>
        r
          ? {
              ...r,
              list: r.list.map((u) => (u.id === user.id ? { ...u, status: next } : u)),
            }
          : r
      );
      setToast(next === 1 ? "有効にしました" : "無効にしました");
    } catch (e) {
      setToast((e as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteUser(deleting.id);
      setToast("ユーザーを削除しました");
      setDeleting(null);
      await load(); // 削除により総ページ数が変わるため再取得する
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
          ユーザー管理
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          新規ユーザー
        </Button>
      </Stack>

      {/* 絞り込み：ユーザー名検索 + 状態 */}
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
        <TextField
          size="small"
          select
          label="状態"
          value={status}
          onChange={(e) => updateQuery({ status: e.target.value, page: "" })}
          sx={{ width: 120 }}
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
                  <TableCell>ユーザー名</TableCell>
                  <TableCell>メールアドレス</TableCell>
                  <TableCell>状態</TableCell>
                  <TableCell>登録日時</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result?.list.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={user.status === 1}
                        onChange={() => handleToggleStatus(user)}
                      />
                    </TableCell>
                    <TableCell>{formatTime(user.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(user)}>
                        編集
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleting(user)}
                      >
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {result?.list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 4 }}>
                      ユーザーがいません
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

      {/* 新規／編集 Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? `ユーザーの編集 · ${editing.username}` : "新規ユーザー"}</DialogTitle>
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
                label="メールアドレス"
                type="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...field("email", {
                  required: "メールアドレスを入力してください",
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "メールアドレスの形式が正しくありません" },
                })}
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
                    (!!editing && !v) || v.length >= 6 || "パスワードは6文字以上で入力してください",
                })}
              />
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

      {/* 削除の再確認 */}
      <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle>ユーザーの削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ユーザー「{deleting?.username}」を削除してもよろしいですか？（論理削除のため、DBA による復元が可能です）
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

export default function UserManagePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <UserManage />
    </Suspense>
  );
}
