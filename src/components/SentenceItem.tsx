"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import type { RubyWord } from "@/types";
import type { TranslationMode } from "./AudioPlayer";

interface SentenceItemProps {
  text: string; // 日本語原文
  rubyWords?: RubyWord[]; // 分かち書き＋振り仮名注記。空の場合は文全体を text としてそのまま描画
  translation: string;
  isActive: boolean; // 現在再生中の文かどうか（ハイライト表示）
  activeWordIndex?: number | null; // 文内で現在読み上げ中と推定される単語インデックス（跟読ハイライト用）
  showRuby: boolean; // 振り仮名の表示/非表示
  translationMode: TranslationMode;
  onClick?: () => void; // 文をクリックした際のコールバック（該当箇所から再生）
}

/** 品詞ごとの背景色（常時表示）：名詞=オレンジ / 動詞=緑 / 形容詞=ピンク / 外来語=青 */
const typeColor: Record<string, string> = {
  noun: "#ffe3bd",
  verb: "#cdeccd",
  adj: "#f9d8e5",
  loan: "#c3e7fb",
};

/** 分かち書きを描画：<ruby> による振り仮名注記＋品詞背景色（分かち書きがない場合は文全体のテキストにフォールバック） */
export function renderRubyWords(
  text: string,
  rubyWords: RubyWord[] | undefined,
  showRuby: boolean,
  withColors: boolean,
  activeWordIndex?: number | null
) {
  if (!rubyWords || rubyWords.length === 0) return text;
  return rubyWords.map((w, idx) => {
    const isWordActive = activeWordIndex != null && activeWordIndex === idx;
    const wordStyle: React.CSSProperties = {
      backgroundColor:
        withColors && w.wordType ? typeColor[w.wordType] : "transparent",
      borderRadius: 4,
      padding: "1px 2px",
      margin:"10px 2px",
      display: "inline-block",
      // 跟読ハイライト：内側の border は常に透明（レイアウト確保用）、外側の outline に色を付けて
      // outlineOffset で単語から離すことで「内枠透明・外枠有色」の二重枠にする
      border: "2px solid transparent",
      outline: isWordActive ? "2px solid #2563eb" : "2px solid transparent",
      outlineOffset: "2px",
      transition: "outline-color 0.2s",
    };
    return w.ruby && showRuby ? (
      <ruby key={idx} style={{ marginRight: 2 }}>
        <span style={wordStyle}>{w.text}</span>
        <rt style={{ fontSize: 10, color: "#888", marginBottom: 5 }}>{w.ruby}</rt>
      </ruby>
    ) : (
      <span key={idx} style={wordStyle}>
        {w.text}
      </span>
    );
  });
}

export default function SentenceItem({
  text,
  rubyWords,
  translation,
  isActive,
  activeWordIndex,
  showRuby,
  translationMode,
  onClick,
}: SentenceItemProps) {
  // この段落の翻訳表示/非表示の個別スイッチ：null＝モードのデフォルトに従う（always は表示 / click は非表示）
  // 翻訳文をクリックすると非表示に、プレースホルダー（クリックして翻訳を表示する）をクリックすると再表示
  const [revealed, setRevealed] = useState<boolean | null>(null);
  useEffect(() => {
    setRevealed(null); // 翻訳モード切り替え時に個別スイッチをリセット
  }, [translationMode]);

  const transVisible = revealed ?? translationMode === "always";

  return (
    <Box
      onClick={() => {
        onClick?.();
      }}
      sx={{
        px: 2,
        py: 1.5,
        cursor: "pointer",
        // 現在読み上げ中の段落：背景色で明確に区別
        bgcolor: isActive ? "#dceafe" : "transparent",
        transition: "background 0.25s",
        borderBottom: "1px solid #f5f5f5",
      }}
    >
      <Box
        component="p"
        sx={{
          m: 0,
          fontSize: 18,
          // 振り仮名表示時は行の高さを広げ、<rt> 用のスペースを確保（単語の二重枠のぶんも見込む）
          lineHeight: showRuby && rubyWords?.length ? 1.8 : 1.4,
          wordBreak: "break-all",
          color: "#1a1a2e",
        }}
      >
        {renderRubyWords(text, rubyWords, showRuby, true, activeWordIndex)}
      </Box>
      {/* 翻訳エリア：翻訳文を表示（クリックで非表示）またはプレースホルダーを表示（クリックで表示）。hidden モードまたは翻訳がない場合は描画しない */}
      {translationMode !== "hidden" &&
        translation &&
        (transVisible ? (
          <Box
            component="p"
            onClick={(e) => {
              e.stopPropagation(); // 段落全体のジャンプ再生をトリガーしない
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
            sx={{
              m: 0,
              mt: 0.5,
              fontSize: 13,
              color: "#bbb",
              lineHeight: 2,
              textAlign: "center",
            }}
          >
            （クリックして翻訳を表示する）
          </Box>
        ))}
    </Box>
  );
}
