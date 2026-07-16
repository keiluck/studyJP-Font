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
