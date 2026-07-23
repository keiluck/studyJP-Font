/**
 * 管理画面のリッチテキスト本文 → 読書ページの文単位データへの変換。
 *
 * 入力時の約束事（管理画面の wangEditor で段落単位でそのまま貼り付ければよい）：
 * - 本文：日本語を段落単位で貼り付け、フロント側で「。！？」により自動分文し、1文ごとに1つの表示単位とする。
 * - 翻訳：article.translation は独立したリッチテキストで、中国語訳も同様に「。！？」で分文し、
 *   日本語の文と順番通りに一対一で対応させる
 *   （段落数が一致する場合は段落単位で対応させてから文単位で対応、一致しない場合は全文を文単位で順番に割り当てる）。
 * - 旧データとの互換性：本文中の日本語段落の直後に続く中国語段落（仮名を含まない）もその段落の翻訳とみなす。
 * - バックエンドに文単位のタイムラインがまだ無いため、音声と文の同期はバックエンドの対応データが揃い次第有効化する。
 */

import type { RubyWord } from "@/types";

/** 読書ビューの表示単位：日本語の1文＋任意の中国語訳（訳文は文の下に表示） */
export interface ReaderSentence {
  id: string;
  text: string; // 日本語の文の原文（プレーンテキスト）
  translation: string; // 中国語訳。無ければ空文字
}

const KANA_RE = /[ぁ-ゟ゠-ヿ]/; // ひらがな/カタカナ
const HAN_RE = /\p{Script=Han}/u;

/** 中国語段落の判定：漢字を含み、かつ仮名を全く含まない */
const isChinese = (text: string) => HAN_RE.test(text) && !KANA_RE.test(text);

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
  // ブロック構造が無い（プレーンテキストのみの）場合は全体を1段落として扱う
  if (blocks.length === 0) {
    const text = (doc.body.textContent || "").trim();
    if (text) blocks.push(text);
  }
  return blocks;
}

/** 文末の句読点（。．！？!?）で分文し、句読点自体は残す。中国語・日本語共通で使用 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。．！？!?])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 中間構造：1つの日本語段落から分文した文のグループ＋その段落の中国語文（対応付け用） */
interface SentenceGroup {
  jp: string[];
  cn: string[];
}

/** リッチテキスト → 文単位のリストへ変換。日本語は段落ごとにグループ化して分文し、中国語訳は文単位で順番に対応付ける */
export function parseReaderSentences(
  html: string,
  translationHtml?: string | null
): ReaderSentence[] {
  // 1. 本文ブロック → 文のグループ。埋め込まれた中国語ブロック（旧データ互換用）は直前の日本語グループに割り当てる
  const groups: SentenceGroup[] = [];
  for (const block of extractBlocks(html)) {
    const prev = groups[groups.length - 1];
    if (isChinese(block) && prev && prev.cn.length === 0) {
      prev.cn = splitSentences(block);
    } else {
      groups.push({ jp: splitSentences(block), cn: [] });
    }
  }

  // 2. 独立した翻訳リッチテキスト（埋め込み中国語より優先）：
  //    段落数が日本語グループ数と一致する場合は段落単位で対応付け、一致しない場合は全文を文単位で順番に割り当てる
  if (translationHtml) {
    const transBlocks = extractBlocks(translationHtml).filter((b) => b.trim());
    if (transBlocks.length === groups.length) {
      groups.forEach((g, i) => (g.cn = splitSentences(transBlocks[i])));
    } else if (transBlocks.length > 0) {
      const allCn = transBlocks.flatMap(splitSentences);
      let cursor = 0;
      for (const g of groups) {
        g.cn = allCn.slice(cursor, cursor + g.jp.length);
        cursor += g.jp.length;
      }
      // 中国語文が日本語文より多い場合、余った分は最後の文の翻訳に結合する
      if (cursor < allCn.length && groups.length > 0) {
        const last = groups[groups.length - 1];
        if (last.cn.length === 0) last.cn = [""];
        last.cn[last.cn.length - 1] += allCn.slice(cursor).join("");
      }
    }
  }

  // 3. グループ内で文単位に対応付けて展開。グループ内で中国語文が多い場合は最後の文に結合する
  const units: ReaderSentence[] = [];
  for (const g of groups) {
    g.jp.forEach((text, i) => {
      let translation = g.cn[i] ?? "";
      if (i === g.jp.length - 1 && g.cn.length > g.jp.length) {
        translation += g.cn.slice(g.jp.length).join("");
      }
      units.push({ id: `s${units.length}`, text, translation });
    });
  }
  return units;
}

/**
 * 文単位のタイムラインが無い場合の概算方式：朗読速度が均一だと仮定し、
 * 各テキスト単位の文字数の比率で音声全体の長さを各単位に按分する。
 * バックエンドが対応データ（startTime/endTime）を提供した後は正確な値に置き換える。
 */

/** 再生進捗の割合 fraction ∈ [0,1] から、該当するテキスト単位のインデックスを概算する */
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

/** index 番目のテキスト単位の概算開始進捗割合 */
export function startFractionOf(texts: string[], index: number): number {
  const total = texts.reduce((sum, t) => sum + t.length, 0);
  if (total === 0) return 0;
  let acc = 0;
  for (let i = 0; i < Math.min(index, texts.length); i++) acc += texts[i].length;
  return acc / total;
}

/**
 * 文内の単語ハイライト用：全体の再生進捗 fraction を「この文が占める範囲」に再正規化し、
 * indexAtFraction と同じアルゴリズムを語レベルに適用してアクティブな単語インデックスを概算する。
 */
export function activeWordIndexInSentence(
  unitTexts: string[],
  sentenceIndex: number,
  wordTexts: string[],
  fraction: number
): number {
  if (wordTexts.length === 0) return -1;
  const start = startFractionOf(unitTexts, sentenceIndex);
  const end = startFractionOf(unitTexts, sentenceIndex + 1);
  const span = end - start;
  if (span <= 0) return 0;
  const local = Math.min(Math.max((fraction - start) / span, 0), 0.9999);
  return indexAtFraction(wordTexts, local);
}

/**
 * 単語表（生词表）機能：kuromoji で分かち書きしたトークン列（RubyWord[]）に対して
 * `words[]`（記事内の全件、`sentenceIndex` による絞り込みはしない——理由は英語モジュールと同じで、
 * 管理画面の句序号入力ミスでその文の単語が丸ごと非表示になる不具合を避けるため）をマッチさせ、
 * 連続するトークンをグループ化する。日本語には英語のような空白区切りが無く regex の `\b` 単語境界が
 * 使えないため、英語版 `matchWordsInSentence`（正規表現の単語境界マッチ）とは異なり、
 * トークンの文字オフセットを使った「文字範囲の重なり」判定でマッチさせる。
 */
export interface VocabSegmentGroup {
  words: RubyWord[]; // このグループに含まれる連続したトークン（1個以上）
  wordId: number | null; // 単語表の該当 id。null はハイライト対象外（地の文のまま描画）
  startIndex: number; // rubyWords 全体における、このグループの先頭トークンのインデックス（跟読ハイライトの index 補正に使用）
}

interface VocabCandidate {
  id: number;
  word: string;
}

/**
 * rubyWords（1文ぶんのトークン列）と単語表候補から、トークンをグループ化してハイライト対象を決定する。
 * - 長い見出し語を優先してマッチさせる（短い語が先に一部を占有して長い語のマッチを妨げないようにする）。
 * - マッチした文字範囲がトークン境界の途中にかかる場合は、重なるトークンをまるごと占有する
 *   （ルビ注記はトークン単位のため、トークンの一部だけを切り出すことはしない）。
 * - 既に占有された範囲と重なる候補はスキップする（同じ文で複数の単語が同じ箇所を取り合わない）。
 */
export function matchVocabInSentence(
  rubyWords: RubyWord[] | undefined,
  words: { id: number; word: string }[]
): VocabSegmentGroup[] {
  if (!rubyWords || rubyWords.length === 0) return [];

  const offsets: number[] = [];
  let acc = 0;
  for (const w of rubyWords) {
    offsets.push(acc);
    acc += w.text.length;
  }
  const fullText = rubyWords.map((w) => w.text).join("");

  const candidates: VocabCandidate[] = words
    .filter((w) => w.word && w.word.trim())
    .map((w) => ({ id: w.id, word: w.word.trim() }))
    .sort((a, b) => b.word.length - a.word.length); // 長い見出し語を優先

  const claimed: (number | null)[] = new Array(rubyWords.length).fill(null);

  for (const c of candidates) {
    const idx = fullText.indexOf(c.word);
    if (idx === -1) continue;
    const end = idx + c.word.length;

    let startTok = -1;
    let endTok = -1;
    for (let i = 0; i < rubyWords.length; i++) {
      const tokStart = offsets[i];
      const tokEnd = tokStart + rubyWords[i].text.length;
      if (tokStart < end && tokEnd > idx) {
        if (startTok === -1) startTok = i;
        endTok = i;
      }
    }
    if (startTok === -1) continue;

    let conflict = false;
    for (let i = startTok; i <= endTok; i++) {
      if (claimed[i] != null) {
        conflict = true;
        break;
      }
    }
    if (conflict) continue;

    for (let i = startTok; i <= endTok; i++) claimed[i] = c.id;
  }

  const groups: VocabSegmentGroup[] = [];
  let i = 0;
  while (i < rubyWords.length) {
    const id = claimed[i];
    let j = i;
    while (j + 1 < rubyWords.length && claimed[j + 1] === id) j++;
    groups.push({ words: rubyWords.slice(i, j + 1), wordId: id, startIndex: i });
    i = j + 1;
  }
  return groups;
}
