/** kuromoji.js には公式の型定義が無いため、本プロジェクトで使用する範囲だけ最小限に宣言する */
declare module "kuromoji" {
  export interface IpadicFeatures {
    surface_form: string; // 表記
    reading?: string; // 読み（カタカナ）。未知語は "*" または欠落
    pos: string; // 品詞
  }

  export interface Tokenizer {
    tokenize(text: string): IpadicFeatures[];
  }

  export interface TokenizerBuilder {
    build(callback: (err: Error | null, tokenizer: Tokenizer) => void): void;
  }

  /** dicPath：辞書ディレクトリ（ブラウザ側では XHR でアクセス可能な URL 接頭辞。例：/dict） */
  export function builder(options: { dicPath: string }): TokenizerBuilder;

  const kuromoji: { builder: typeof builder };
  export default kuromoji;
}
