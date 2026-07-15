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

/** 新增/编辑共用的表单值；编辑时 username 只读、password 留空表示不修改 */
interface UserFormValues {
  username: string;
  email: string;
  password: string;
}

function UserManage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 筛选与分页条件以 URL query 为准，刷新后保持
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const username = searchParams.get("username") || "";
  const status = searchParams.get("status") || "";

  const [result, setResult] = useState<PageResult<UserInfo> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState(username); // 搜索框输入值（回车/点搜索才生效）
  const [toast, setToast] = useState<string | null>(null);

  // Dialog 状态：新增/编辑共用，editing 为 null 表示新增
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
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [page, username, status]);

  useEffect(() => {
    load();
  }, [load]);

  /** 更新 URL query（筛选变化时重置到第 1 页） */
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
        // 本地更新列表，不整表重拉
        setResult((r) =>
          r
            ? { ...r, list: r.list.map((u) => (u.id === editing.id ? updated : u)) }
            : r
        );
        setToast("用户已更新");
      } else {
        await createUser({ ...values, status: 1 });
        setToast("用户已创建");
        await load(); // 新增涉及分页总数，重拉当前页
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
      setToast(next === 1 ? "已启用" : "已禁用");
    } catch (e) {
      setToast((e as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteUser(deleting.id);
      setToast("用户已删除");
      setDeleting(null);
      await load(); // 删除影响分页总数，重拉
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
          用户管理
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          新增用户
        </Button>
      </Stack>

      {/* 筛选：用户名搜索 + 状态 */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="用户名"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateQuery({ username: keyword, page: "" });
          }}
        />
        <Button variant="outlined" onClick={() => updateQuery({ username: keyword, page: "" })}>
          搜索
        </Button>
        <TextField
          size="small"
          select
          label="状态"
          value={status}
          onChange={(e) => updateQuery({ status: e.target.value, page: "" })}
          sx={{ width: 120 }}
        >
          <MenuItem value="">全部</MenuItem>
          <MenuItem value="1">正常</MenuItem>
          <MenuItem value="0">禁用</MenuItem>
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
              重试
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
                  <TableCell>用户名</TableCell>
                  <TableCell>邮箱</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>注册时间</TableCell>
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
                        编辑
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleting(user)}
                      >
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {result?.list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 4 }}>
                      暂无用户
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

      {/* 新增/编辑 Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? `编辑用户 · ${editing.username}` : "新增用户"}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmitForm)} noValidate>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {formError && <Alert severity="error">{formError}</Alert>}
              <TextField
                label="用户名"
                disabled={!!editing}
                error={!!errors.username}
                helperText={errors.username?.message}
                {...field("username", { required: editing ? false : "请输入用户名" })}
              />
              <TextField
                label="邮箱"
                type="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...field("email", {
                  required: "请输入邮箱",
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "邮箱格式不正确" },
                })}
              />
              <TextField
                label={editing ? "密码（留空不修改）" : "密码"}
                type="password"
                autoComplete="new-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                {...field("password", {
                  required: editing ? false : "请输入密码",
                  validate: (v) =>
                    (!!editing && !v) || v.length >= 6 || "密码至少 6 位",
                })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setFormOpen(false)}>取消</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "保存中…" : "保存"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* 删除二次确认 */}
      <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle>删除用户</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定删除用户「{deleting?.username}」吗？（软删除，可由 DBA 恢复）
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>取消</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            删除
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
