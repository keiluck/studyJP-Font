"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import type { EnWordItem } from "@/types/enArticle";
import type { EnTranslationMode } from "./EnAudioPlayer";
import { tokenizeEnglishSentence, type EnWordToken } from "@/lib/enArticleContent";

interface EnSentenceItemProps {
  text: string; // 英語原文
  words: EnWordItem[]; // 記事の単語表全件（テキスト一致するものだけをこの文でハイライトする。sentenceIndex では絞り込まない）
  translation: string;
  isActive: boolean; // 現在朗読中の文かどうか（赤ハイライト）
  activeWordIndex?: number | null; // 文内で現在読み上げ中と推定される単語インデックス（跟読ハイライト用）
  translationMode: EnTranslationMode;
  onWordClick: (wordId: number) => void; // 句中の難語をクリックした際のコールバック（単語表ボトムシートを開く）
}

/** 単語トークン1つを跟読ハイライト（青枠）付きでレンダリングする（vocab グルーピングの内側で共用） */
function renderWordToken(tok: EnWordToken, key: React.Key, activeWordIndex: number | null | undefined) {
  const isActiveWord = activeWordIndex != null && tok.wordIndex === activeWordIndex;
  const wordStyle: React.CSSProperties = {
    border: "2px solid transparent",
    outline: isActiveWord ? "2px solid #2563eb" : "2px solid transparent",
    outlineOffset: "2px",
    transition: "outline-color 0.2s",
    borderRadius: 4,
  };
  return tok.wordIndex == null ? (
    <span key={key}>{tok.text}</span>
  ) : (
    <span key={key} style={wordStyle}>
      {tok.text}
    </span>
  );
}

/**
 * 文テキストを句中難語ハイライト＋跟読ハイライトの両方に対応したトークン列としてレンダリングする。
 * ページ側の集中リスニングモードでも同じ関数を再利用する（日本語版 `renderRubyWords` と同じ方針）。
 *
 * 句中難語（`vocabWordId`）は "environmentally friendly" のように複数の単語トークンにまたがる
 * ことがあるため、`tokenizeEnglishSentence` が返すフラットなトークン列を、連続する同一
 * `vocabWordId` ごとに1つのグループへまとめてから描画する。**グループ単位でクリック領域・
 * マーカーを1つにまとめる**（1トークンずつ描画すると複合語が別々にクリック可能・マーカー重複に
 * なってしまうため）。跟読ハイライトの青枠はグループ内の各単語トークンに個別に適用する。
 */
export function renderEnTokens(
  text: string,
  words: EnWordItem[],
  isActive: boolean,
  activeWordIndex: number | null | undefined,
  onWordClick: (wordId: number) => void
) {
  const tokens = tokenizeEnglishSentence(text, words);

  const groups: { tokens: EnWordToken[]; vocabWordId: number | null }[] = [];
  for (const tok of tokens) {
    const last = groups[groups.length - 1];
    if (last && last.vocabWordId === tok.vocabWordId) {
      last.tokens.push(tok);
    } else {
      groups.push({ tokens: [tok], vocabWordId: tok.vocabWordId });
    }
  }

  return groups.map((g, gi) => {
    if (g.vocabWordId == null) {
      return <span key={gi}>{g.tokens.map((tok, ti) => renderWordToken(tok, ti, activeWordIndex))}</span>;
    }
    return (
      <Box
        key={gi}
        component="span"
        onClick={(e) => {
          e.stopPropagation();
          onWordClick(g.vocabWordId as number);
        }}
        sx={{
          position: "relative",
          display: "inline-block",
          px: "3px",
          cursor: "pointer",
          // 難語の青い背景色は「朗読中の文」のときのみ表示（isActive の影響を受ける）
          ...(isActive && {
            bgcolor: "rgba(43,95,150,0.14)",
            color: "#2b5f96",
            fontWeight: 700,
          }),
        }}
      >
        {g.tokens.map((tok, ti) => renderWordToken(tok, ti, activeWordIndex))}
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
    );
  });
}

export default function EnSentenceItem({
  text,
  words,
  translation,
  isActive,
  activeWordIndex,
  translationMode,
  onWordClick,
}: EnSentenceItemProps) {
  // この文の翻訳表示/非表示の個別スイッチ：null＝モードのデフォルトに従う
  const [revealed, setRevealed] = useState<boolean | null>(null);
  useEffect(() => {
    setRevealed(null);
  }, [translationMode]);

  const transVisible = revealed ?? translationMode === "always";

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
        {renderEnTokens(text, words, isActive, activeWordIndex, onWordClick)}
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
