"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import type { RubyWord } from "@/types";
import type { TranslationMode } from "./AudioPlayer";

interface SentenceItemProps {
  text: string; // 日语原文
  rubyWords?: RubyWord[]; // 分词+假名标注；为空时整句渲染 text
  translation: string;
  isActive: boolean; // 是否当前播放句（高亮）
  showRuby: boolean; // 假名（振り仮名）显隐
  translationMode: TranslationMode;
  onClick?: () => void; // 点句回调（接跳转播放）
}

/** 背景标注配色：高亮句内按词类型着色 */
const typeColor: Record<string, string> = {
  han: "#ffb74d", // 汉字：橙
  katakana: "#4fc3f7", // 片假名：蓝
  en: "#aed581", // 英数：绿
  other: "transparent",
};

const getWordType = (text: string) => {
  if (/\p{Script=Han}/u.test(text)) return "han";
  if (/[゠-ヿ]/.test(text)) return "katakana";
  if (/[A-Za-z0-9]/.test(text)) return "en";
  return "other";
};

/** 渲染分词：假名 <ruby> 标注 + 高亮句内背景标注（无分词时退回整句文本） */
export function renderRubyWords(
  text: string,
  rubyWords: RubyWord[] | undefined,
  showRuby: boolean,
  withHighlight: boolean
) {
  if (!rubyWords || rubyWords.length === 0) return text;
  return rubyWords.map((w, idx) => {
    const type = getWordType(w.text);
    const wordStyle: React.CSSProperties = {
      backgroundColor:
        withHighlight && type !== "other" ? typeColor[type] : "transparent",
      borderRadius: 4,
      padding: "1px 4px",
      display: "inline-block",
    };
    return w.ruby && showRuby ? (
      <ruby key={idx} style={{ marginRight: 2 }}>
        <span style={wordStyle}>{w.text}</span>
        <rt style={{ fontSize: 10, color: "#888" }}>{w.ruby}</rt>
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
  showRuby,
  translationMode,
  onClick,
}: SentenceItemProps) {
  // click 模式下本句翻译的显隐开关
  const [showTrans, setShowTrans] = useState(false);

  const transVisible =
    translationMode === "always" || (translationMode === "click" && showTrans);

  return (
    <Box
      onClick={() => {
        onClick?.();
        if (translationMode === "click") setShowTrans((v) => !v);
      }}
      sx={{
        px: 2,
        py: 1.5,
        cursor: "pointer",
        bgcolor: isActive ? "#f0f7ff" : "transparent",
        transition: "background 0.15s",
        borderBottom: "1px solid #f5f5f5",
      }}
    >
      <Box
        component="p"
        sx={{
          m: 0,
          fontSize: 18,
          // 显示假名时行高加大，给 <rt> 留空间
          lineHeight: showRuby && rubyWords?.length ? 2.2 : 1.8,
          wordBreak: "break-all",
          color: "#1a1a2e",
        }}
      >
        {renderRubyWords(text, rubyWords, showRuby, isActive)}
      </Box>
      {/* 用 opacity 过渡而非条件渲染，click 模式切换时不跳动 */}
      {translationMode !== "hidden" && (
        <Box
          component="p"
          sx={{
            m: 0,
            mt: 0.5,
            fontSize: 13,
            color: "#888",
            lineHeight: 1.5,
            opacity: transVisible ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        >
          {translation}
        </Box>
      )}
    </Box>
  );
}
