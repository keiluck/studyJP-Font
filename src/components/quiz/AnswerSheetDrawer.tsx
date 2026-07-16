"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import CloseIcon from "@mui/icons-material/Close";
import QuizStatusGrid from "./QuizStatusGrid";
import RetryButton from "./RetryButton";
import { fetchPracticeCard } from "@/api/quiz";
import type { PracticeCard } from "@/types/quiz";

interface AnswerSheetDrawerProps {
  open: boolean;
  onClose: () => void;
  recordId: number;
  currentSeq: number;
  onJump: (seq: number) => void;
}

/** 答題カード（Drawer）。開くたびに最新の practice を再取得する（別タブ回答などのズレ防止） */
export default function AnswerSheetDrawer({
  open,
  onClose,
  recordId,
  currentSeq,
  onJump,
}: AnswerSheetDrawerProps) {
  const router = useRouter();
  const [card, setCard] = useState<PracticeCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setCard(null);
    fetchPracticeCard(recordId)
      .then(setCard)
      .catch((e) => setError(e instanceof Error ? e.message : "読み込みに失敗しました"));
  }, [open, recordId]);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxHeight: "80vh", borderTopLeftRadius: 16, borderTopRightRadius: 16 } }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            答題カード
          </Typography>
          <IconButton onClick={onClose} aria-label="閉じる">
            <CloseIcon />
          </IconButton>
        </Stack>

        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : !card ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <QuizStatusGrid
              items={card.items}
              currentSeq={currentSeq}
              onJump={(seq) => {
                onJump(seq);
                onClose();
              }}
            />
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <RetryButton recordId={recordId} variant="outlined" fullWidth />
              <Button variant="contained" fullWidth onClick={() => router.push(`/practice/${recordId}/result`)}>
                査看練習結果
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </Drawer>
  );
}
