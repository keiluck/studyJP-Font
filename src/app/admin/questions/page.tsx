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
import { deleteQuestion, fetchAdminQuestions } from "@/api/admin/question";
import { fetchAdminCategories } from "@/api/admin/category";
import type { AdminQuestionListItem, QuestionType } from "@/types/quiz";
import type { PageResult } from "@/types";

const PAGE_SIZE = 10;

const formatTime = (s: string) => s?.replace("T", " ").slice(0, 16) || "-";

function QuestionManage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 絞り込み条件とページング条件は URL クエリを基準とし、リロード後も保持される
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";
  const subject = searchParams.get("subject") || "";
  const category = searchParams.get("category") || "";
  const keyword = searchParams.get("keyword") || "";

  const [result, setResult] = useState<PageResult<AdminQuestionListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState(keyword);
  const [toast, setToast] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminQuestionListItem | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchAdminCategories("QUESTION_SUBJECT")
      .then((items) => setSubjects(items.map((c) => c.value)))
      .catch(() => {});
  }, []);

  // 分類（QUESTION_CATEGORY）は学科でスコープされる。学科フィルタ未選択（すべて）のときは全学科分を返す
  useEffect(() => {
    fetchAdminCategories("QUESTION_CATEGORY", subject || undefined)
      .then((items) => setCategories(items.map((c) => c.value)))
      .catch(() => {});
  }, [subject]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(
        await fetchAdminQuestions({
          page,
          pageSize: PAGE_SIZE,
          type: type ? (Number(type) as QuestionType) : undefined,
          status: status === "" ? undefined : Number(status),
          subject: subject || undefined,
          category: category || undefined,
          keyword: keyword || undefined,
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [page, type, status, subject, category, keyword]);

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
    router.replace(`/admin/questions?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteQuestion(deleting.id);
      setToast("問題を削除しました");
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
          問題管理
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} component={Link} href="/admin/questions/edit">
          新規問題
        </Button>
      </Stack>

      {/* 絞り込み：題幹キーワード + 種別 + 学科 + 分類 + 状態 */}
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          label="題幹キーワード"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateQuery({ keyword: keywordInput, page: "" });
          }}
        />
        <Button variant="outlined" onClick={() => updateQuery({ keyword: keywordInput, page: "" })}>
          検索
        </Button>
        <TextField
          size="small"
          select
          label="種別"
          value={type}
          onChange={(e) => updateQuery({ type: e.target.value, page: "" })}
          sx={{ width: 130 }}
        >
          <MenuItem value="">すべて</MenuItem>
          <MenuItem value="1">単一選択</MenuItem>
          <MenuItem value="2">多肢選択</MenuItem>
        </TextField>
        <TextField
          size="small"
          select
          label="学科"
          value={subject}
          onChange={(e) => updateQuery({ subject: e.target.value, category: "", page: "" })}
          sx={{ width: 130 }}
        >
          <MenuItem value="">すべて</MenuItem>
          {subjects.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          select
          label="分類"
          value={category}
          onChange={(e) => updateQuery({ category: e.target.value, page: "" })}
          sx={{ width: 130 }}
        >
          <MenuItem value="">すべて</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          select
          label="状態"
          value={status}
          onChange={(e) => updateQuery({ status: e.target.value, page: "" })}
          sx={{ width: 130 }}
        >
          <MenuItem value="">すべて</MenuItem>
          <MenuItem value="1">公開済み</MenuItem>
          <MenuItem value="0">下書き</MenuItem>
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
                  <TableCell>種別</TableCell>
                  <TableCell>題幹</TableCell>
                  <TableCell>学科</TableCell>
                  <TableCell>分類</TableCell>
                  <TableCell>公開レベル</TableCell>
                  <TableCell>状態</TableCell>
                  <TableCell>更新日時</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result?.list.map((q) => (
                  <TableRow key={q.id} hover>
                    <TableCell>{q.id}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={q.type === 1 ? "単選" : "多選"}
                        color={q.type === 1 ? "primary" : "secondary"}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 360 }}>
                      <Typography variant="body2" noWrap title={q.stem}>
                        {q.stem}
                      </Typography>
                    </TableCell>
                    <TableCell>{q.subject}</TableCell>
                    <TableCell>{q.category || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={q.accessLevel === 1 ? "VIP限定" : "無料試読"}
                        color={q.accessLevel === 1 ? "warning" : "default"}
                        variant={q.accessLevel === 1 ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={q.status === 1 ? "公開済み" : "下書き"}
                        color={q.status === 1 ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>{formatTime(q.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        component={Link}
                        href={`/admin/questions/edit/${q.id}`}
                      >
                        編集
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleting(q)}
                      >
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {result?.list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ color: "text.secondary", py: 4 }}>
                      問題がありません
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
        <DialogTitle>問題の削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            問題「{deleting?.stem}」を削除してもよろしいですか？（論理削除のため、削除後は即座に練習の出題から見えなくなります）
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

export default function QuestionManagePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <QuestionManage />
    </Suspense>
  );
}
