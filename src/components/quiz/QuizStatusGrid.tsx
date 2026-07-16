"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { itemStatus, type ItemStatus } from "@/lib/quizStatus";
import type { PracticeCardItem } from "@/types/quiz";

const CIRCLE_STYLE: Record<ItemStatus, object> = {
  unanswered: {
    bgcolor: "background.paper",
    color: "text.primary",
    border: "1px solid",
    borderColor: "grey.400",
  },
  correct: { bgcolor: "success.main", color: "success.contrastText" },
  wrong: { bgcolor: "error.main", color: "error.contrastText" },
};

interface QuizStatusGridProps {
  items: PracticeCardItem[];
  /** 現在表示中の問題の seq。指定時は「当前」バッジを表示する */
  currentSeq?: number;
  /** 指定時、番号タップでジャンプできるようにする */
  onJump?: (seq: number) => void;
}

export default function QuizStatusGrid({ items, currentSeq, onJump }: QuizStatusGridProps) {
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 3, mb: 2 }}>
        <Legend colorSx={CIRCLE_STYLE.unanswered} label="未作答" />
        <Legend colorSx={CIRCLE_STYLE.correct} label="答対" />
        <Legend colorSx={CIRCLE_STYLE.wrong} label="答錯" />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1.5 }}>
        {items.map((item) => {
          const status = itemStatus(item);
          return (
            <Box
              key={item.seq}
              sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}
            >
              <Box
                role={onJump ? "button" : undefined}
                tabIndex={onJump ? 0 : undefined}
                onClick={onJump ? () => onJump(item.seq) : undefined}
                onKeyDown={
                  onJump
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") onJump(item.seq);
                      }
                    : undefined
                }
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: onJump ? "pointer" : "default",
                  ...CIRCLE_STYLE[status],
                }}
              >
                {item.seq}
              </Box>
              {currentSeq === item.seq && (
                <Box
                  sx={{
                    fontSize: 10,
                    color: "#fff",
                    bgcolor: "grey.900",
                    borderRadius: 0.5,
                    px: 0.5,
                    lineHeight: "16px",
                  }}
                >
                  当前
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function Legend({ colorSx, label }: { colorSx: object; label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Box sx={{ width: 14, height: 14, borderRadius: "50%", ...colorSx }} />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
