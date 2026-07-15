import type { RubyWord, WordType } from "@/types";

/**
 * 浏览器端假名（振り仮名）自动标注：kuromoji 分词 + 读音转平假名。
 * 词典（public/dict，约 17MB gzip 分片）首次调用时异步加载，全局只初始化一次。
 * 后端暂无逐句标注数据，先由前端生成；后续后端提供 rubyWords 时可直接替换。
 */

type Tokenizer = import("kuromoji").Tokenizer;

let tokenizerPromise: Promise<Tokenizer> | null = null;

function getTokenizer(): Promise<Tokenizer> {
  if (!tokenizerPromise) {
    tokenizerPromise = import("kuromoji").then(
      (kuromoji) =>
        new Promise<Tokenizer>((resolve, reject) => {
          kuromoji.default.builder({ dicPath: "/dict" }).build((err, tokenizer) => {
            if (err) reject(err);
            else resolve(tokenizer);
          });
        })
    );
    // 失败时清掉缓存，下次调用可重试（如网络抖动导致词典分片下载失败）
    tokenizerPromise.catch(() => {
      tokenizerPromise = null;
    });
  }
  return tokenizerPromise;
}

const KANJI_RE = /\p{Script=Han}/u;
const KATAKANA_ONLY_RE = /^[ァ-ヶーｦ-ﾟ・\s]+$/; // 纯片假名词面 → 外来语

/** 片假名 → 平假名（读音展示用） */
const kataToHira = (s: string) =>
  s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

/** kuromoji 词性 → 着色词类；外来语（纯片假名）优先于词性判定 */
function classifyWord(surface: string, pos: string): WordType | undefined {
  if (KATAKANA_ONLY_RE.test(surface)) return "loan";
  if (pos === "動詞") return "verb";
  if (pos === "形容詞") return "adj";
  if (pos === "名詞") return "noun";
  return undefined;
}

/** 对一批文本分词并生成假名标注与词类；仅含汉字的词标注 ruby */
export async function annotateTexts(texts: string[]): Promise<RubyWord[][]> {
  const tokenizer = await getTokenizer();
  return texts.map((text) =>
    tokenizer.tokenize(text).map((token) => {
      const word: RubyWord = { text: token.surface_form };
      if (KANJI_RE.test(token.surface_form) && token.reading && token.reading !== "*") {
        word.ruby = kataToHira(token.reading);
      }
      const wordType = classifyWord(token.surface_form, token.pos);
      if (wordType) word.wordType = wordType;
      return word;
    })
  );
}
