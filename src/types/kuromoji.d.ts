/** kuromoji.js 无官方类型声明，按本项目用到的最小面声明 */
declare module "kuromoji" {
  export interface IpadicFeatures {
    surface_form: string; // 词面
    reading?: string; // 读音（片假名），未登录词为 "*" 或缺失
    pos: string; // 词性
  }

  export interface Tokenizer {
    tokenize(text: string): IpadicFeatures[];
  }

  export interface TokenizerBuilder {
    build(callback: (err: Error | null, tokenizer: Tokenizer) => void): void;
  }

  /** dicPath：词典目录（浏览器端为 XHR 可达的 URL 前缀，如 /dict） */
  export function builder(options: { dicPath: string }): TokenizerBuilder;

  const kuromoji: { builder: typeof builder };
  export default kuromoji;
}
