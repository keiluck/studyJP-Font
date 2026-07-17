/**
 * 英語精読ページ専用：リッチテキスト本文 → 文単位データへの変換 ＋ 句中難語のマッチ。
 * 日本語版 `lib/articleContent.ts` とは独立した実装（英語の分文規則・句読点が異なるため共用しない）。
 *
 * 入力時の約束事（管理画面で段落単位でそのまま貼り付ければよい）：
 * - 本文：英語を段落単位で貼り付け、フロント側で `. ! ?` により自動分文する。
 * - 翻訳：`en_article.translation` は独立したリッチテキストで、中国語訳も段落単位で貼り付け、
 *   `。！？` で分文したうえで英語の文と順番通りに一対一で対応させる
 *   （段落数が一致する場合は段落単位で対応させてから文単位で対応、一致しない場合は全文を文単位で順番に割り当てる）。
 */

import type { EnWordItem } from "@/types/enArticle";

/** 読書ビューの表示単位：英語の1文＋任意の中国語訳 */
export interface EnReaderSentence {
  id: string;
  text: string; // 英語の文の原文（プレーンテキスト）
  translation: string; // 中国語訳。無ければ空文字
}

/** リッチテキストからブロック要素のテキスト（p/見出し/li/blockquote）を取り出す。画像などテキスト以外のノードは無視 */
function extractBlocks(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: string[] = [];
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (/^(UL|OL|BLOCKQUOTE)$/.test(child.tagName)) {
        walk(child);
      } else {
        const text = (child.textContent || "").replace(/\s+/g, " ").trim();
        if (text) blocks.push(text);
      }
    }
  };
  walk(doc.body);
  if (blocks.length === 0) {
    const text = (doc.body.textContent || "").trim();
    if (text) blocks.push(text);
  }
  return blocks;
}

/** 英語の文末記号（. ! ?）で分文する。省略語・引用符などの厳密な処理は行わない簡易版 */
export function splitEnglishSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 中国語の文末記号（。！？!?）で分文する */
function splitChineseSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？!?])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface SentenceGroup {
  en: string[];
  zh: string[];
}

/** リッチテキスト → 文単位のリストへ変換 */
export function parseEnglishSentences(
  html: string,
  translationHtml?: string | null
): EnReaderSentence[] {
  const groups: SentenceGroup[] = extractBlocks(html).map((block) => ({
    en: splitEnglishSentences(block),
    zh: [],
  }));

  if (translationHtml) {
    const transBlocks = extractBlocks(translationHtml).filter((b) => b.trim());
    if (transBlocks.length === groups.length) {
      groups.forEach((g, i) => (g.zh = splitChineseSentences(transBlocks[i])));
    } else if (transBlocks.length > 0) {
      const allZh = transBlocks.flatMap(splitChineseSentences);
      let cursor = 0;
      for (const g of groups) {
        g.zh = allZh.slice(cursor, cursor + g.en.length);
        cursor += g.en.length;
      }
      if (cursor < allZh.length && groups.length > 0) {
        const last = groups[groups.length - 1];
        if (last.zh.length === 0) last.zh = [""];
        last.zh[last.zh.length - 1] += allZh.slice(cursor).join("");
      }
    }
  }

  const units: EnReaderSentence[] = [];
  for (const g of groups) {
    g.en.forEach((text, i) => {
      let translation = g.zh[i] ?? "";
      if (i === g.en.length - 1 && g.zh.length > g.en.length) {
        translation += g.zh.slice(g.en.length).join("");
      }
      units.push({ id: `es${units.length}`, text, translation });
    });
  }
  return units;
}

/**
 * 文単位のタイムラインが無いため、朗読速度が均一だと仮定し文字数比率で音声全体の長さを按分する。
 * 日本語版と同じ考え方だが、英語モジュール専用に独立させた実装。
 */
export function indexAtFraction(texts: string[], fraction: number): number {
  const total = texts.reduce((sum, t) => sum + t.length, 0);
  if (total === 0 || texts.length === 0) return 0;
  let acc = 0;
  for (let i = 0; i < texts.length; i++) {
    acc += texts[i].length;
    if (fraction < acc / total) return i;
  }
  return texts.length - 1;
}

export function startFractionOf(texts: string[], index: number): number {
  const total = texts.reduce((sum, t) => sum + t.length, 0);
  if (total === 0) return 0;
  let acc = 0;
  for (let i = 0; i < Math.min(index, texts.length); i++) acc += texts[i].length;
  return acc / total;
}

/** 文中の難語ハイライト用セグメント。wordId が付いた区間だけクリック可能な単語として描画する */
export interface EnSentenceSegment {
  text: string;
  wordId?: number;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 文テキストを words[] で分割する。
 * `sentenceIndex` では絞り込まない——管理画面で入力する句序号は自動分文の実際の番号とズレやすく
 * （0始まりの数え間違い等）、ズレた瞬間にその単語が該当文で一切ハイライトされなくなるのを避けるため、
 * 記事内の words 全件を対象に「その単語のテキストが実際にこの文に含まれるか」だけで判定する
 * （大文字小文字を無視した単語境界一致のみで、部分文字列一致はしない）。
 * 同じ単語が複数の文に登場する場合は、それぞれの文で独立にハイライトされる（重複してもよい）。
 */
export function matchWordsInSentence(text: string, words: EnWordItem[]): EnSentenceSegment[] {
  const candidates = words.filter((w) => w.word.trim());
  if (candidates.length === 0) return [{ text }];

  const matches: { start: number; end: number; wordId: number }[] = [];
  for (const w of candidates) {
    const re = new RegExp(`\\b${escapeRegExp(w.word)}\\b`, "i");
    const m = re.exec(text);
    if (m) matches.push({ start: m.index, end: m.index + m[0].length, wordId: w.id });
  }
  matches.sort((a, b) => a.start - b.start);

  const nonOverlapping: typeof matches = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      nonOverlapping.push(m);
      lastEnd = m.end;
    }
  }

  const segments: EnSentenceSegment[] = [];
  let cursor = 0;
  for (const m of nonOverlapping) {
    if (m.start > cursor) segments.push({ text: text.slice(cursor, m.start) });
    segments.push({ text: text.slice(m.start, m.end), wordId: m.wordId });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
