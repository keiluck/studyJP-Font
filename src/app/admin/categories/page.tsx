"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
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
  createCategory,
  deleteCategory,
  fetchAdminCategories,
  updateCategory,
} from "@/api/admin/category";
import type { CategoryItem, CategoryScope } from "@/types/category";

const SCOPES: { value: CategoryScope; label: string }[] = [
  { value: "ARTICLE_LEVEL", label: "記事レベル" },
  { value: "ARTICLE_CATEGORY", label: "記事分類" },
  { value: "EN_ARTICLE_LEVEL", label: "英語レベル" },
  { value: "EN_ARTICLE_CATEGORY", label: "英語分類" },
  { value: "QUESTION_CATEGORY", label: "問題分類" },
  { value: "QUESTION_SUBJECT", label: "問題学科" },
];

/** QUESTION_CATEGORY は学科（QUESTION_SUBJECT）でさらにスコープされる（フェーズ10） */
const SUBJECT_SCOPED: CategoryScope = "QUESTION_CATEGORY";

const formatTime = (s: string) => s?.replace("T", " ").slice(0, 16) || "-";

interface CategoryFormValues {
  value: string;
}

export default function CategoryManagePage() {
  const [scope, setScope] = useState<CategoryScope>("ARTICLE_LEVEL");
  const [subjectOptions, setSubjectOptions] = useState<CategoryItem[]>([]);
  const [subject, setSubject] = useState("");
  const [list, setList] = useState<CategoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<CategoryItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>();

  const needsSubject = scope === SUBJECT_SCOPED;

  // 問題分類タブを開いたら学科の一覧を取得し、選択中の学科が無ければ先頭を選ぶ
  useEffect(() => {
    if (!needsSubject) return;
    fetchAdminCategories("QUESTION_SUBJECT")
      .then((items) => {
        setSubjectOptions(items);
        setSubject((cur) => (cur && items.some((i) => i.value === cur) ? cur : items[0]?.value || ""));
      })
      .catch(() => {});
  }, [needsSubject]);

  const load = useCallback(async () => {
    if (needsSubject && !subject) {
      setList([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setList(await fetchAdminCategories(scope, needsSubject ? subject : undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [scope, needsSubject, subject]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    reset({ value: "" });
    setFormOpen(true);
  };

  const openEdit = (item: CategoryItem) => {
    setEditing(item);
    setFormError(null);
    reset({ value: item.value });
    setFormOpen(true);
  };

  const onSubmitForm = async (values: CategoryFormValues) => {
    setFormError(null);
    setSubmitting(true);
    try {
      if (editing) {
        const updated = await updateCategory(editing.id, {
          value: values.value,
          status: editing.status,
        });
        setList((l) => (l ? l.map((c) => (c.id === editing.id ? updated : c)) : l));
        setToast("分類を更新しました");
      } else {
        await createCategory({ scope, subject: needsSubject ? subject : undefined, value: values.value });
        setToast("分類を追加しました");
        await load();
      }
      setFormOpen(false);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: CategoryItem) => {
    const next = item.status === 1 ? 0 : 1;
    try {
      const updated = await updateCategory(item.id, { value: item.value, status: next });
      setList((l) => (l ? l.map((c) => (c.id === item.id ? updated : c)) : l));
      setToast(next === 1 ? "有効にしました" : "無効にしました");
    } catch (e) {
      setToast((e as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      setDeleteError(null);
      await deleteCategory(deleting.id);
      setToast("分類を削除しました");
      setDeleting(null);
      await load();
    } catch (e) {
      // 使用中の場合バックエンドが400を返す。そのメッセージをそのまま表示する
      setDeleteError((e as Error).message);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }} spacing={2}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          分類管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          disabled={needsSubject && !subject}
        >
          新規追加
        </Button>
      </Stack>

      <Tabs
        value={scope}
        onChange={(_, v) => setScope(v)}
        sx={{ mb: 2 }}
        textColor="primary"
        indicatorColor="primary"
      >
        {SCOPES.map((s) => (
          <Tab key={s.value} value={s.value} label={s.label} />
        ))}
      </Tabs>

      {/* 問題分類は学科（QUESTION_SUBJECT）でスコープされるため、学科サブセレクタで絞り込む */}
      {needsSubject && (
        <TextField
          select
          size="small"
          label="学科"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          sx={{ mb: 2, width: 200 }}
        >
          {subjectOptions.length === 0 && <MenuItem value="">学科がありません</MenuItem>}
          {subjectOptions.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.value}
            </MenuItem>
          ))}
        </TextField>
      )}

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
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>値</TableCell>
                <TableCell>状態</TableCell>
                <TableCell>更新日時</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list?.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.value}</TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Switch
                        size="small"
                        checked={item.status === 1}
                        onChange={() => handleToggleStatus(item)}
                      />
                      <Chip
                        size="small"
                        label={item.status === 1 ? "有効" : "無効"}
                        color={item.status === 1 ? "success" : "default"}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>{formatTime(item.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(item)}>
                      編集
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        setDeleteError(null);
                        setDeleting(item);
                      }}
                    >
                      削除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {list?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: "text.secondary", py: 4 }}>
                    分類がありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 新規／編集 Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {editing
            ? `分類の編集 · ${editing.value}`
            : `新規分類（${SCOPES.find((s) => s.value === scope)?.label}${needsSubject ? ` · ${subject}` : ""}）`}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmitForm)} noValidate>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {formError && <Alert severity="error">{formError}</Alert>}
              <TextField
                label="値"
                autoFocus
                error={!!errors.value}
                helperText={errors.value?.message}
                {...field("value", { required: "値を入力してください" })}
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
        <DialogTitle>分類の削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            分類「{deleting?.value}」を削除してもよろしいですか？使用中の場合は削除できません（先に無効化してください）。
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
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
