"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import { retryPractice } from "@/api/quiz";

interface RetryButtonProps {
  recordId: number;
  variant?: "outlined" | "contained";
  fullWidth?: boolean;
}

/** 重新練習：確認ダイアログ → retry API → 新しい練習ページへ遷移。既存記録は上書きしない */
export default function RetryButton({ recordId, variant = "outlined", fullWidth }: RetryButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      const { id } = await retryPractice(recordId);
      router.push(`/practice/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "重新練習を開始できませんでした");
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant={variant} fullWidth={fullWidth} onClick={() => setOpen(true)}>
        重新練習
      </Button>
      <Dialog open={open} onClose={() => !loading && setOpen(false)}>
        <DialogTitle>重新練習</DialogTitle>
        <DialogContent>
          <DialogContentText>
            同じ問題セット・同じ出題順で新しい練習を開始します（現在の記録はそのまま保持されます）。よろしいですか？
          </DialogContentText>
          {error && (
            <DialogContentText color="error" sx={{ mt: 1 }}>
              {error}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            キャンセル
          </Button>
          <Button variant="contained" onClick={handleRetry} disabled={loading}>
            {loading ? "作成中…" : "開始する"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
