"use client";

import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import CloseIcon from "@mui/icons-material/Close";
import type { WordItem } from "@/types";

interface WordSheetProps {
  open: boolean;
  onClose: () => void;
  words: WordItem[]; // sortOrder 順の全件
  activeWordId: number | null; // 句中クリック（入口B）で開いた場合はその wordId。底部ボタン（入口A）は null
}

/**
 * 単語表ボトムシート（日本語版）。2つの入口（底部「単語」ボタン／句中の単語クリック）が同じコンポーネントを開く。
 * 英語精読モジュールの EnWordSheet と同じ構造だが、フィールドは 単語（漢字表記）/ふりがな/品詞/中国語釈義/日中対訳例文。
 */
export default function WordSheet({ open, onClose, words, activeWordId }: WordSheetProps) {
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (open && activeWordId != null) {
      // Drawer のマウント完了を待ってからスクロールする
      const timer = setTimeout(() => {
        cardRefs.current[activeWordId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, activeWordId]);

  const activeWord = words.find((w) => w.id === activeWordId);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "20px 20px 0 0",
          maxHeight: "76vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "#ddd", mx: "auto", mt: 1.2, mb: 0.5 }} />
      <Box sx={{ display: "flex", alignItems: "center", px: 2, pt: 1, pb: 1, borderBottom: "1px solid #eee" }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, fontSize: 17 }}>
          単語
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", px: 2, pt: 1, pb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {activeWord ? (
            <>
              文中クリック由来 · <b style={{ color: "#2b5f96" }}>{activeWord.word}</b>
            </>
          ) : (
            "本文の単語"
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          全 {words.length} 語
        </Typography>
      </Box>

      <Box sx={{ overflowY: "auto", flex: 1, pb: 2 }}>
        {words.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            この記事にはまだ単語データがありません
          </Typography>
        ) : (
          words.map((w) => {
            const active = w.id === activeWordId;
            return (
              <Box
                key={w.id}
                ref={(el: HTMLDivElement | null) => {
                  cardRefs.current[w.id] = el;
                }}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: "1px solid #f2f2f2",
                  position: "relative",
                  ...(active && {
                    bgcolor: "rgba(43,95,150,0.1)",
                    borderLeft: "3px solid #2b5f96",
                  }),
                }}
              >
                {active && (
                  <Chip
                    label="たった今クリック"
                    size="small"
                    variant="outlined"
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 16,
                      color: "#2b5f96",
                      borderColor: "#2b5f96",
                      height: 20,
                      fontSize: 11,
                    }}
                  />
                )}
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.2, mb: 0.5, pr: 8 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{w.word}</Typography>
                  {w.reading && (
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{w.reading}</Typography>
                  )}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  {w.partOfSpeech && (
                    <Chip
                      label={w.partOfSpeech}
                      size="small"
                      sx={{ height: 18, fontSize: 10.5, bgcolor: "rgba(31,92,87,0.1)", color: "#1f5c57", fontWeight: 700 }}
                    />
                  )}
                  <Typography sx={{ fontSize: 14 }}>{w.meaningZh}</Typography>
                </Box>
                {w.exampleJa && (
                  <Typography sx={{ fontSize: 12.5, fontStyle: "italic", color: "#333", lineHeight: 1.5 }}>
                    {w.exampleJa}
                  </Typography>
                )}
                {w.exampleZh && (
                  <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5, mt: 0.2 }}>
                    {w.exampleZh}
                  </Typography>
                )}
              </Box>
            );
          })
        )}
      </Box>
    </Drawer>
  );
}
