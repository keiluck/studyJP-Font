"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import type { RubyWord, WordItem } from "@/types";
import type { TranslationMode } from "./AudioPlayer";
import { matchVocabInSentence } from "@/lib/articleContent";

interface SentenceItemProps {
  text: string; // 日本語原文
  rubyWords?: RubyWord[]; // 分かち書き＋振り仮名注記。空の場合は文全体を text としてそのまま描画
  translation: string;
  isActive: boolean; // 現在再生中の文かどうか（ハイライト表示）
  activeWordIndex?: number | null; // 文内で現在読み上げ中と推定される単語インデックス（跟読ハイライト用）
  showRuby: boolean; // 振り仮名の表示/非表示
  translationMode: TranslationMode;
  onClick?: () => void; // 文をクリックした際のコールバック（該当箇所から再生）
  words?: WordItem[]; // 単語表（記事内の全件）。テキスト一致するものだけをこの文でマーカー表示する
  onWordClick?: (wordId: number) => void; // 単語表に登録された単語をクリックした際のコールバック（単語表ボトムシートを開く）
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

/**
 * `renderRubyWords` に単語表マーカーを重ねて描画する。マッチは kuromoji トークン単位で行う
 * （`lib/articleContent.ts` の `matchVocabInSentence`。日本語には英語のような単語境界が無いため、
 * トークンの文字オフセットで単語表の見出し語と照合し、連続するトークンをグループ化する）。
 * マーカーは文がアクティブかどうかに関わらず常時表示する（既存の品詞背景色と同じ「常時表示」の考え方）。
 * `renderRubyWords` 自体のシグネチャは変更せず、グループ単位で呼び出すだけに留める
 * （集中リスニングモードなど既存の呼び出し元に影響を与えないため）。
 */
export function renderVocabRubyWords(
  text: string,
  rubyWords: RubyWord[] | undefined,
  words: WordItem[] | undefined,
  showRuby: boolean,
  withColors: boolean,
  activeWordIndex: number | null | undefined,
  onWordClick?: (wordId: number) => void
) {
  if (!rubyWords || rubyWords.length === 0) return text;
  if (!words || words.length === 0 || !onWordClick) {
    return renderRubyWords(text, rubyWords, showRuby, withColors, activeWordIndex);
  }

  const groups = matchVocabInSentence(rubyWords, words);
  return groups.map((g, gi) => {
    const localActiveIndex =
      activeWordIndex != null ? activeWordIndex - g.startIndex : activeWordIndex;
    const rendered = renderRubyWords(text, g.words, showRuby, withColors, localActiveIndex);
    if (g.wordId == null) {
      return <span key={gi}>{rendered}</span>;
    }
    return (
      <Box
        key={gi}
        component="span"
        onClick={(e) => {
          e.stopPropagation(); // 文全体のジャンプ再生を誘発しない
          onWordClick(g.wordId as number);
        }}
        sx={{ position: "relative", display: "inline-block", cursor: "pointer" }}
      >
        {rendered}
        {/* 単語表マーカー：左上の小さな丸印。isActive の影響を受けず常に表示する */}
        <Box
          component="span"
          aria-hidden
          sx={{
            position: "absolute",
            top: -3,
            left: -3,
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

export default function SentenceItem({
  text,
  rubyWords,
  translation,
  isActive,
  activeWordIndex,
  showRuby,
  translationMode,
  onClick,
  words,
  onWordClick,
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
        {renderVocabRubyWords(text, rubyWords, words, showRuby, true, activeWordIndex, onWordClick)}
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
