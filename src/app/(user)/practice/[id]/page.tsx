"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import FlagIcon from "@mui/icons-material/Flag";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GridViewIcon from "@mui/icons-material/GridView";
import { fetchPracticeCard, fetchPracticeQuestion, submitAnswer } from "@/api/quiz";
import { labelsEqual } from "@/lib/quizStatus";
import AnswerSheetDrawer from "@/components/quiz/AnswerSheetDrawer";
import type { PracticeCard, Question } from "@/types/quiz";

type OptionStatus = "picking" | "selected-correct" | "selected-wrong" | "missed" | "normal";

function optionLabelStyle(status: OptionStatus) {
  switch (status) {
    case "selected-correct":
    case "missed":
      return { bgcolor: "success.main", color: "success.contrastText" };
    case "selected-wrong":
      return { bgcolor: "error.main", color: "error.contrastText" };
    case "picking":
      return { bgcolor: "primary.main", color: "primary.contrastText" };
    default:
      return { bgcolor: "background.paper", color: "text.primary", border: "1px solid", borderColor: "grey.400" };
  }
}

function optionTextColor(status: OptionStatus) {
  if (status === "selected-correct" || status === "missed") return "success.main";
  if (status === "selected-wrong") return "error.main";
  return "text.primary";
}

function PracticeQuestion() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = Number(params.id);
  const seq = Math.max(1, Number(searchParams.get("seq")) || 1);

  const [card, setCard] = useState<PracticeCard | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]); // 多選の未提出の選択中ラベル
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const refreshCard = useCallback(() => {
    return fetchPracticeCard(recordId)
      .then(setCard)
      .catch((err) => setError(err instanceof Error ? err.message : "読み込みに失敗しました"));
  }, [recordId]);

  const loadQuestion = useCallback(() => {
    setLoading(true);
    setError(null);
    setSelected([]);
    setSubmitError(null);
    // 遷移直後は前の問題（回答済み・操作不可）が一瞬残ってクリックが無効化されて見えるのを防ぐため、
    // 新しい問題を読み込む前に一旦クリアしてローディング表示に切り替える
    setQuestion(null);
    return fetchPracticeQuestion(recordId, seq)
      .then(setQuestion)
      .catch((err) => setError(err instanceof Error ? err.message : "問題の読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [recordId, seq]);

  useEffect(() => {
    refreshCard();
  }, [refreshCard]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const submit = async (labels: string[]) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      await submitAnswer(recordId, seq, labels);
      const [q] = await Promise.all([fetchPracticeQuestion(recordId, seq), refreshCard()]);
      setQuestion(q);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "回答の送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOptionClick = (label: string) => {
    if (!question || question.answered || submitting) return;
    if (question.type === 1) {
      submit([label]);
    } else {
      setSelected((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
    }
  };

  const goTo = (newSeq: number) => {
    if (!card) return;
    const clamped = Math.min(Math.max(1, newSeq), card.questionCount);
    router.push(`/practice/${recordId}?seq=${clamped}`);
  };

  const optionStatus = (label: string): OptionStatus => {
    if (!question) return "normal";
    if (!question.answered) {
      return question.type === 2 && selected.includes(label) ? "picking" : "normal";
    }
    const isMine = question.myLabels?.includes(label) ?? false;
    const isCorrect = question.correctLabels?.includes(label) ?? false;
    if (isMine && isCorrect) return "selected-correct";
    if (isMine && !isCorrect) return "selected-wrong";
    if (!isMine && isCorrect) return "missed";
    return "normal";
  };

  if (loading && !question) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error && !question) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={loadQuestion}>再試行</Button>}>
        {error}
      </Alert>
    );
  }
  if (!question) return null;

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <FlagIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          {seq} / {card?.questionCount ?? "…"}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={() => setSheetOpen(true)} aria-label="答題カードを開く">
          <GridViewIcon />
        </IconButton>
      </Stack>

      {card?.finished && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => router.push(`/practice/${recordId}/result`)}>
              結果を見る
            </Button>
          }
        >
          全問回答済みです
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Chip
              size="small"
              label={question.type === 1 ? "単選" : "多選"}
              color={question.type === 1 ? "primary" : "secondary"}
            />
            <Typography variant="caption" color="text.secondary">
              題目 #{question.questionId}
            </Typography>
          </Stack>
          <Typography variant="h6" sx={{ whiteSpace: "pre-wrap" }}>
            {question.stem}
          </Typography>
        </Box>

        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {question.options.map((opt) => {
            const status = optionStatus(opt.label);
            const disabled = question.answered || submitting;
            return (
              <Box
                key={opt.label}
                role="button"
                data-testid={`quiz-option-${opt.label}`}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleOptionClick(opt.label)}
                onKeyDown={(e) => {
                  if (!disabled && (e.key === "Enter" || e.key === " ")) handleOptionClick(opt.label);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  cursor: disabled ? "default" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    flexShrink: 0,
                    ...optionLabelStyle(status),
                  }}
                >
                  {status === "selected-correct" ? (
                    <CheckIcon fontSize="small" />
                  ) : status === "selected-wrong" ? (
                    <CloseIcon fontSize="small" />
                  ) : (
                    opt.label
                  )}
                </Box>
                <Typography sx={{ color: optionTextColor(status) }}>{opt.content}</Typography>
              </Box>
            );
          })}
        </Stack>

        {question.type === 2 && !question.answered && (
          <Button
            variant="contained"
            disabled={selected.length === 0 || submitting}
            onClick={() => submit(selected)}
            sx={{ mb: 2 }}
          >
            確認
          </Button>
        )}

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {question.answered && question.myLabels && question.correctLabels && (
          <Typography sx={{ mb: 2 }}>
            正確答案{" "}
            <Box component="span" sx={{ color: "success.main", fontWeight: 600 }}>
              {question.correctLabels.join("")}
            </Box>
            {"　"}您選択{" "}
            <Box
              component="span"
              sx={{
                color: labelsEqual(question.myLabels, question.correctLabels) ? "success.main" : "error.main",
                fontWeight: 600,
              }}
            >
              {question.myLabels.join("")}
            </Box>
          </Typography>
        )}

        {question.answered && question.explanation && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                — 試題詳解 —
              </Typography>
            </Divider>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              原解析
            </Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }} color="text.secondary">
              {question.explanation}
            </Typography>
          </Box>
        )}
      </Paper>

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button startIcon={<ArrowBackIcon />} disabled={seq <= 1} onClick={() => goTo(seq - 1)}>
          前の問題
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          endIcon={<ArrowForwardIcon />}
          disabled={!card || seq >= card.questionCount}
          onClick={() => goTo(seq + 1)}
        >
          次の問題
        </Button>
      </Stack>

      <AnswerSheetDrawer
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        recordId={recordId}
        currentSeq={seq}
        onJump={(newSeq) => goTo(newSeq)}
      />
    </Box>
  );
}

export default function PracticeQuestionPage() {
  // useSearchParams は Suspense 境界が必要（Next.js の静的プリレンダリングの要件）
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <PracticeQuestion />
    </Suspense>
  );
}
