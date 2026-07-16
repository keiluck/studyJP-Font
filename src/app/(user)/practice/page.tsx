"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import QuizIcon from "@mui/icons-material/Quiz";
import { startPractice } from "@/api/quiz";

export default function PracticeEntryPage() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    try {
      setStarting(true);
      setError(null);
      const { id } = await startPractice();
      router.push(`/practice/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "練習を開始できませんでした");
      setStarting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
      <Card sx={{ maxWidth: 480, width: "100%" }}>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <QuizIcon sx={{ fontSize: 56, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            問題演習
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            単一選択・多肢選択の問題に挑戦し、回答後にすぐ正誤と解析を確認できます。
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={starting ? <CircularProgress size={18} color="inherit" /> : undefined}
            disabled={starting}
            onClick={handleStart}
          >
            練習を開始
          </Button>
          {error && (
            <Alert severity="error" sx={{ mt: 3, textAlign: "left" }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
