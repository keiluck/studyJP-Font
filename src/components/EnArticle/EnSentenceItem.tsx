"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import type { EnWordItem } from "@/types/enArticle";
import type { EnTranslationMode } from "./EnAudioPlayer";
import { matchWordsInSentence } from "@/lib/enArticleContent";

interface EnSentenceItemProps {
  text: string; // 英語原文
  words: EnWordItem[]; // 記事の単語表全件（テキスト一致するものだけをこの文でハイライトする。sentenceIndex では絞り込まない）
  translation: string;
  isActive: boolean; // 現在朗読中の文かどうか（赤ハイライト）
  translationMode: EnTranslationMode;
  onWordClick: (wordId: number) => void; // 句中の難語をクリックした際のコールバック（単語表ボトムシートを開く）
}

export default function EnSentenceItem({
  text,
  words,
  translation,
  isActive,
  translationMode,
  onWordClick,
}: EnSentenceItemProps) {
  // この文の翻訳表示/非表示の個別スイッチ：null＝モードのデフォルトに従う
  const [revealed, setRevealed] = useState<boolean | null>(null);
  useEffect(() => {
    setRevealed(null);
  }, [translationMode]);

  const transVisible = revealed ?? translationMode === "always";
  const segments = matchWordsInSentence(text, words);

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderBottom: "1px solid #f5f5f5",
        // 文全体（英文＋中国語訳）を一緒に赤くハイライトする：朗読中の文のハイライトは下の2段落を包む必要があり、英文部分だけではない
        ...(isActive && {
          bgcolor: "rgba(200,57,42,0.12)",
          border: "1px solid rgba(200,57,42,0.35)",
          borderRadius: "8px",
        }),
      }}
    >
      {/* 文自体はクリック不可（クリックでのジャンプ再生は廃止）、下で抽出した重点単語のみクリック可能 */}
      <Box component="p" sx={{ m: 0, fontSize: 16, lineHeight: 1.8, color: "#1a1a2e" }}>
        {segments.map((seg, idx) =>
          seg.wordId ? (
            <Box
              key={idx}
              component="span"
              onClick={(e) => {
                e.stopPropagation();
                onWordClick(seg.wordId as number);
              }}
              sx={{
                position: "relative",
                display: "inline-block",
                borderRadius: "4px",
                px: "3px",
                cursor: "pointer",
                // 難語の青い背景色は「朗読中の文」のときのみ表示（日本語版の品詞着色が isActive のときのみ表示されるルールと同様）
                ...(isActive && {
                  bgcolor: "rgba(43,95,150,0.14)",
                  color: "#2b5f96",
                  fontWeight: 700,
                }),
              }}
            >
              {seg.text}
              {/* 重点単語マーク：右上の小さい丸印。isActive の影響を受けず、常にクリック可能な重点語であることを示す */}
              <Box
                component="span"
                aria-hidden
                sx={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "#2b5f96",
                  border: "1px solid #fff",
                }}
              />
            </Box>
          ) : (
            <span key={idx}>{seg.text}</span>
          )
        )}
      </Box>

      {translationMode !== "hidden" &&
        translation &&
        (transVisible ? (
          <Box
            component="p"
            onClick={(e) => {
              e.stopPropagation();
              setRevealed(false);
            }}
            sx={{ m: 0, mt: 0.5, fontSize: 13, color: "#888", lineHeight: 1.5 }}
          >
            {translation}
          </Box>
        ) : (
          <Box
            component="p"
            onClick={(e) => {
              e.stopPropagation();
              setRevealed(true);
            }}
            sx={{ m: 0, mt: 0.5, fontSize: 13, color: "#bbb", lineHeight: 1.5, textAlign: "center" }}
          >
            （クリックして翻訳を表示する）
          </Box>
        ))}
    </Box>
  );
}
