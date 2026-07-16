"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import { fetchPracticeCard, fetchPracticeQuestion } from "@/api/quiz";
import QuizStatusGrid from "@/components/quiz/QuizStatusGrid";
import RetryButton from "@/components/quiz/RetryButton";
import type { PracticeCard } from "@/types/quiz";

interface WrongItem {
  seq: number;
  stem: string;
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="h5" sx={{ color, fontWeight: 600 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default function PracticeResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const recordId = Number(params.id);

  const [card, setCard] = useState<PracticeCard | null>(null);
  const [wrongItems, setWrongItems] = useState<WrongItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const c = await fetchPracticeCard(recordId);
      setCard(c);
      const wrongSeqs = c.items.filter((i) => i.answered && i.correct === false).map((i) => i.seq);
      const details = await Promise.all(
        wrongSeqs.map((seq) => fetchPracticeQuestion(recordId, seq).then((q) => ({ seq, stem: q.stem })))
      );
      setWrongItems(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error || !card) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>再試行</Button>}>
        {error}
      </Alert>
    );
  }

  const accuracy = card.answeredCount > 0 ? Math.round((card.correctCount / card.answeredCount) * 100) : 0;

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 3, textAlign: "center" }}>
        練習結果
      </Typography>

      <Paper sx={{ p: 4, mb: 3, textAlign: "center" }}>
        {!card.finished && <Chip label="未完了" color="warning" size="small" sx={{ mb: 2 }} />}
        <Typography variant="h2" sx={{ fontWeight: 700, color: "primary.main" }}>
          {accuracy}%
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          正答率
        </Typography>
        <Stack direction="row" justifyContent="center" spacing={4}>
          <Stat label="問題数" value={card.questionCount} color="text.primary" />
          <Stat label="答対" value={card.correctCount} color="success.main" />
          <Stat label="答錯" value={card.wrongCount} color="error.main" />
          <Stat label="未回答" value={card.questionCount - card.answeredCount} color="text.secondary" />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <QuizStatusGrid items={card.items} onJump={(seq) => router.push(`/practice/${recordId}?seq=${seq}`)} />
      </Paper>

      {wrongItems.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ p: 2, pb: 0 }}>
            錯題一覧
          </Typography>
          <List>
            {wrongItems.map((w) => (
              <ListItemButton key={w.seq} onClick={() => router.push(`/practice/${recordId}?seq=${w.seq}`)}>
                <ListItemText
                  primary={`#${w.seq}　${w.stem}`}
                  primaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <RetryButton recordId={recordId} variant="contained" />
      </Box>
    </Box>
  );
}
