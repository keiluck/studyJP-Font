/**
 * 后台富文本正文 → 阅读页逐段/逐句数据。
 *
 * 录入约定（后台 wangEditor）：
 * - 每个日语段落一个 <p>；
 * - 日语段落后紧跟的中文段落（不含假名）视为该段的中文翻译；
 * - 后端暂无逐句时间轴，句音同步待后端对齐数据就绪后启用。
 */

/** 阅读视图单元：一个日语段落 + 可选中文翻译（与参照样式一致，翻译跟在段落下方） */
export interface ReaderParagraph {
  id: string;
  text: string; // 日语段落原文（纯文本）
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

/** 富文本 → 段落列表；紧跟日语段的中文段合并为其翻译 */
export function parseReaderParagraphs(html: string): ReaderParagraph[] {
  const paragraphs: ReaderParagraph[] = [];
  for (const block of extractBlocks(html)) {
    const prev = paragraphs[paragraphs.length - 1];
    if (isChinese(block) && prev && !prev.translation) {
      prev.translation = block;
    } else {
      paragraphs.push({ id: `p${paragraphs.length}`, text: block, translation: "" });
    }
  }
  return paragraphs;
}

/** 段落 → 句子（集中听力的最小单位），按日文句读切分并保留标点 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。．！？!?])/)
    .map((s) => s.trim())
    .filter(Boolean);
}
