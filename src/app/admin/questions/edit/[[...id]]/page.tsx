"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { createQuestion, fetchAdminQuestionDetail, updateQuestion } from "@/api/admin/question";
import { fetchAdminCategories } from "@/api/admin/category";
import type { QuestionSavePayload, QuestionType } from "@/types/quiz";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const LABELS = "ABCDEF";

interface OptionFormValue {
  content: string;
  correct: boolean;
}

interface QuestionFormValues {
  type: QuestionType;
  subject: string;
  stem: string;
  explanation: string;
  category: string;
  status: 0 | 1;
  accessLevel: 0 | 1;
  options: OptionFormValue[];
}

const emptyOption = (): OptionFormValue => ({ content: "", correct: false });

export default function QuestionEditPage() {
  const params = useParams<{ id?: string[] }>();
  const router = useRouter();
  const id = params.id?.[0] ? Number(params.id[0]) : null;

  const [loading, setLoading] = useState(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  // 学科が実際に切り替わった（＝初回のデータ読み込みではない）場合のみ分類の選択をリセットする
  const prevSubjectRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    fetchAdminCategories("QUESTION_SUBJECT")
      .then((items) => setSubjectOptions(items.filter((c) => c.status === 1).map((c) => c.value)))
      .catch(() => {});
  }, []);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    defaultValues: {
      type: 1,
      subject: "",
      stem: "",
      explanation: "",
      category: "",
      status: 0,
      accessLevel: 0,
      options: [emptyOption(), emptyOption()],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const type = watch("type");
  const subject = watch("subject");
  const options = watch("options");

  // 分類（QUESTION_CATEGORY）は学科でスコープされるため、学科が変わるたびに選択肢を取り直す
  useEffect(() => {
    if (!subject) {
      setCategoryOptions([]);
      return;
    }
    fetchAdminCategories("QUESTION_CATEGORY", subject)
      .then((items) => {
        setCategoryOptions(items.filter((c) => c.status === 1).map((c) => c.value));
        if (prevSubjectRef.current !== undefined && prevSubjectRef.current !== subject) {
          setValue("category", "");
        }
        prevSubjectRef.current = subject;
      })
      .catch(() => {});
  }, [subject, setValue]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setLoadError(null);
      const detail = await fetchAdminQuestionDetail(id);
      reset({
        type: detail.type,
        subject: detail.subject,
        stem: detail.stem,
        explanation: detail.explanation || "",
        category: detail.category || "",
        status: detail.status as 0 | 1,
        accessLevel: (detail.accessLevel ?? 0) as 0 | 1,
        options: detail.options.map((o) => ({ content: o.content, correct: o.correct })),
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTypeChange = (next: QuestionType) => {
    setValue("type", next);
    if (next === 1) {
      // 単選に切り替えた場合、正解チェックが複数残っていると矛盾するため最初の1件のみ残す
      const firstCorrect = options.findIndex((o) => o.correct);
      options.forEach((_, i) => setValue(`options.${i}.correct`, i === firstCorrect && firstCorrect >= 0));
    }
  };

  const handleCorrectChange = (index: number, checked: boolean) => {
    if (type === 1) {
      // 単一選択はラジオボタンと同じ挙動：常に1件のみ選択可能にする
      options.forEach((_, i) => setValue(`options.${i}.correct`, i === index && checked));
    } else {
      setValue(`options.${index}.correct`, checked);
    }
  };

  const onSubmit = async (values: QuestionFormValues) => {
    const correctCount = values.options.filter((o) => o.correct).length;
    if (values.type === 1 && correctCount !== 1) {
      setFormError("単一選択の正解はちょうど1件指定してください");
      return;
    }
    if (values.type === 2 && correctCount < 2) {
      setFormError("多肢選択の正解は2件以上指定してください");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const payload: QuestionSavePayload = {
        type: values.type,
        subject: values.subject,
        stem: values.stem.trim(),
        explanation: values.explanation.trim() || undefined,
        category: values.category.trim() || undefined,
        status: values.status,
        accessLevel: values.accessLevel,
        options: values.options.map((o) => ({ content: o.content.trim(), correct: o.correct })),
      };
      if (id) await updateQuestion(id, payload);
      else await createQuestion(payload);
      router.push("/admin/questions");
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (loadError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>再試行</Button>}>
        {loadError}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => router.push("/admin/questions")} aria-label="一覧に戻る">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">{id ? `問題の編集 #${id}` : "新規問題"}</Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={3}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={2}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="種別"
                      onChange={(e) => handleTypeChange(Number(e.target.value) as QuestionType)}
                    >
                      <MenuItem value={1}>単一選択</MenuItem>
                      <MenuItem value={2}>多肢選択</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="状態">
                      <MenuItem value={0}>下書き</MenuItem>
                      <MenuItem value={1}>公開済み</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Controller
                  name="accessLevel"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="公開レベル">
                      <MenuItem value={0}>無料試読</MenuItem>
                      <MenuItem value={1}>VIP限定</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Controller
                  name="subject"
                  control={control}
                  rules={{ required: "学科を選択してください" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="学科"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    >
                      {/* 編集中の問題が既に無効化された学科を持つ場合も選択肢に残す */}
                      {(field.value && !subjectOptions.includes(field.value)
                        ? [field.value, ...subjectOptions]
                        : subjectOptions
                      ).map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={8} md={4}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="分類（任意）" disabled={!subject}>
                      <MenuItem value="">なし</MenuItem>
                      {/* 編集中の問題が既に無効化された分類を持つ場合も選択肢に残し、変更しない限り送信できるようにする */}
                      {(field.value && !categoryOptions.includes(field.value)
                        ? [field.value, ...categoryOptions]
                        : categoryOptions
                      ).map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>

            <TextField
              label="題幹"
              multiline
              minRows={3}
              error={!!errors.stem}
              helperText={errors.stem?.message}
              {...register("stem", { required: "題幹を入力してください" })}
            />

            <Box>
              <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  選択肢（2〜6件、正解にチェック）
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  disabled={fields.length >= MAX_OPTIONS}
                  onClick={() => append(emptyOption())}
                >
                  選択肢を追加
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {fields.map((field, index) => (
                  <Stack key={field.id} direction="row" alignItems="center" spacing={1.5}>
                    <Typography sx={{ width: 24, fontWeight: 600 }}>{LABELS[index]}</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder={`選択肢 ${LABELS[index]}`}
                      error={!!errors.options?.[index]?.content}
                      {...register(`options.${index}.content`, {
                        required: "選択肢の内容を入力してください",
                      })}
                    />
                    <Controller
                      name={`options.${index}.correct`}
                      control={control}
                      render={({ field: cf }) => (
                        <FormControlLabel
                          sx={{ mr: 0, whiteSpace: "nowrap" }}
                          control={
                            <Checkbox
                              checked={cf.value}
                              onChange={(e) => handleCorrectChange(index, e.target.checked)}
                            />
                          }
                          label="正解"
                        />
                      )}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      disabled={fields.length <= MIN_OPTIONS}
                      onClick={() => remove(index)}
                      aria-label="選択肢を削除"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <TextField label="試題解析（原解析、任意）" multiline minRows={3} {...register("explanation")} />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => router.push("/admin/questions")}>キャンセル</Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "保存中…" : "保存"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
