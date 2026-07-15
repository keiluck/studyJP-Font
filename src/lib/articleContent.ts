/**
 * 后台富文本正文 → 阅读页逐句数据。
 *
 * 录入约定（后台 wangEditor，整段粘贴即可）：
 * - 正文：日语整段粘贴，前端按 。！？ 自动分句，每句一个展示单元；
 * - 翻译：article.translation 独立富文本，中文同样按 。！？ 分句，与日语句按顺序一一配对
 *   （段落数一致时先按段配对再逐句配对；不一致时全文逐句顺序配对）；
 * - 兼容旧数据：正文内日语段后紧跟的中文段（不含假名）也视为该段翻译；
 * - 后端暂无逐句时间轴，句音同步待后端对齐数据就绪后启用。
 */

/** 阅读视图单元：一个日语句子 + 可选中文翻译（翻译跟在句子下方） */
export interface ReaderSentence {
  id: string;
  text: string; // 日语句子原文（纯文本）
  translation: string; // 中文翻译；无则空串
}

const KANA_RE = /[ぁ-ゟ゠-ヿ]/; // 平假名/片假名
const HAN_RE = /\p{Script=Han}/u;

/** 中文段判定：含汉字且完全不含假名 */
const isChinese = (text: string) => HAN_RE.test(text) && !KANA_RE.test(text);

/** 取出富文本中的块级文本（p/标题/li/blockquote），忽略图片等非文本节点 */
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
  // 无块级结构（纯文本内容）时整体作为一段
  if (blocks.length === 0) {
    const text = (doc.body.textContent || "").trim();
    if (text) blocks.push(text);
  }
  return blocks;
}

/** 按句末标点（。．！？!?）切句并保留标点，中日文通用 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。．！？!?])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 中间结构：一个日语段落切出的句子组 + 该段的中文句子（配对用） */
interface SentenceGroup {
  jp: string[];
  cn: string[];
}

/** 富文本 → 逐句列表；日语按段分组切句，中文逐句按顺序配对 */
export function parseReaderSentences(
  html: string,
  translationHtml?: string | null
): ReaderSentence[] {
  // 1. 正文块 → 句子组；内嵌中文块（旧数据兼容）配给前一个日语组
  const groups: SentenceGroup[] = [];
  for (const block of extractBlocks(html)) {
    const prev = groups[groups.length - 1];
    if (isChinese(block) && prev && prev.cn.length === 0) {
      prev.cn = splitSentences(block);
    } else {
      groups.push({ jp: splitSentences(block), cn: [] });
    }
  }

  // 2. 独立翻译富文本（优先于内嵌中文）：
  //    段落数与日语组数一致时按段配对；否则全文逐句按顺序分配
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
      // 中文句子多于日语句子时，余下的并入最后一句翻译
      if (cursor < allCn.length && groups.length > 0) {
        const last = groups[groups.length - 1];
        if (last.cn.length === 0) last.cn = [""];
        last.cn[last.cn.length - 1] += allCn.slice(cursor).join("");
      }
    }
  }

  // 3. 组内逐句配对展开；组内中文多出的并入该组最后一句
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
 * 无逐句时间轴时的估算方案：假定朗读速度均匀，
 * 按各文本单元字符数占比把整条音频时长分摊到每个单元。
 * 待后端提供对齐数据（startTime/endTime）后替换为精确值。
 */

/** 播放进度比例 fraction ∈ [0,1] 估算落在第几个文本单元 */
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

/** 第 index 个文本单元的估算起始进度比例 */
export function startFractionOf(texts: string[], index: number): number {
  const total = texts.reduce((sum, t) => sum + t.length, 0);
  if (total === 0) return 0;
  let acc = 0;
  for (let i = 0; i < Math.min(index, texts.length); i++) acc += texts[i].length;
  return acc / total;
}
