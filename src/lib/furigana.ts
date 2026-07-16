import type { RubyWord, WordType } from "@/types";

/**
 * ブラウザ側での振り仮名自動注記：kuromoji による分かち書き＋読みの平仮名変換。
 * 辞書（public/dict、gzip 分割で約17MB）は初回呼び出し時に非同期で読み込み、グローバルで一度だけ初期化する。
 * バックエンドに文単位の注記データがまだ無いため、まずフロント側で生成する。将来バックエンドが rubyWords を提供する際にそのまま置き換え可能。
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
    // 失敗時はキャッシュをクリアし、次回呼び出しでリトライ可能にする（ネットワーク不調で辞書分割ファイルのダウンロードが失敗した場合など）
    tokenizerPromise.catch(() => {
      tokenizerPromise = null;
    });
  }
  return tokenizerPromise;
}

const KANJI_RE = /\p{Script=Han}/u;
const KATAKANA_ONLY_RE = /^[ァ-ヶーｦ-ﾟ・\s]+$/; // カタカナのみの語 → 外来語

/** カタカナ → ひらがな（読み表示用） */
const kataToHira = (s: string) =>
  s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

/** kuromoji の品詞 → 着色用の品詞分類。外来語（カタカナのみ）の判定を品詞判定より優先する */
function classifyWord(surface: string, pos: string): WordType | undefined {
  if (KATAKANA_ONLY_RE.test(surface)) return "loan";
  if (pos === "動詞") return "verb";
  if (pos === "形容詞") return "adj";
  if (pos === "名詞") return "noun";
  return undefined;
}

/** 複数のテキストをまとめて分かち書きし、振り仮名注記と品詞を生成する。漢字を含む語にのみ ruby を付与する */
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
