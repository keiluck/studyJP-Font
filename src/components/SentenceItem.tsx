"use client";

import { useEffect, useState } from "react";
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

/** 词类背景配色（常显）：名词橙 / 动词绿 / 形容词粉 / 外来语蓝 */
const typeColor: Record<string, string> = {
  noun: "#ffe3bd",
  verb: "#cdeccd",
  adj: "#f9d8e5",
  loan: "#c3e7fb",
};

/** 渲染分词：假名 <ruby> 标注 + 词类背景着色（无分词时退回整句文本） */
export function renderRubyWords(
  text: string,
  rubyWords: RubyWord[] | undefined,
  showRuby: boolean,
  withColors: boolean
) {
  if (!rubyWords || rubyWords.length === 0) return text;
  return rubyWords.map((w, idx) => {
    const wordStyle: React.CSSProperties = {
      backgroundColor:
        withColors && w.wordType ? typeColor[w.wordType] : "transparent",
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
  // 本段翻译显隐的单独开关：null=跟随模式默认（always 显示 / click 隐藏）；
  // 点中文隐藏、点占位（クリックして翻訳を表示する）恢复
  const [revealed, setRevealed] = useState<boolean | null>(null);
  useEffect(() => {
    setRevealed(null); // 切换通訳模式时重置单独开关
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
        // 当前朗读段落：整段明显背景区分
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
          // 显示假名时行高加大，给 <rt> 留空间
          lineHeight: showRuby && rubyWords?.length ? 2.2 : 1.8,
          wordBreak: "break-all",
          color: "#1a1a2e",
        }}
      >
        {renderRubyWords(text, rubyWords, showRuby, true)}
      </Box>
      {/* 翻译区：显示中文（点它隐藏）或占位提示（点它显示）；hidden 模式与无翻译时不渲染 */}
      {translationMode !== "hidden" &&
        translation &&
        (transVisible ? (
          <Box
            component="p"
            onClick={(e) => {
              e.stopPropagation(); // 不触发整段的跳播
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
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            （クリックして翻訳を表示する）
          </Box>
        ))}
    </Box>
  );
}
