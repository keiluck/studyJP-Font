/**
 * 英語精読モジュールの型定義。日本語の article/Article* 型とは完全に独立させる
 * （level は CEFR、単語表という日本語モジュールに無いデータを持つため）。
 */

/** 英語記事レベル。値は分類管理（scope=EN_ARTICLE_LEVEL、CEFR: A1〜C2）で管理されるため固定リテラルにしない */
export type EnArticleLevel = string;

/** 英語記事一覧項目（本文・単語を含まない） */
export interface EnArticleListItem {
  id: number;
  title: string;
  level: EnArticleLevel;
  category: string;
  coverUrl: string | null;
  createdAt: string;
}

/** 音声（バックエンドの EnAudioItem） */
export interface EnAudioItem {
  id: number;
  url: string;
  title: string | null;
  sortOrder: number;
}

/**
 * 難語（バックエンドの EnWordItem）。sentenceIndex は `parseEnglishSentences` が生成する文番号（0始まり）と対応し、
 * word は本文中の表記そのまま（大文字小文字保持）で句中ハイライトのマッチに使う。
 */
export interface EnWordItem {
  id: number;
  sentenceIndex: number;
  word: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  meaningZh: string;
  exampleEn: string | null;
  exampleZh: string | null;
  sortOrder: number;
}

/**
 * 英語記事詳細（バックエンドの EnArticleDetailResponse）。
 * words は sortOrder 順の全件で、句中ハイライトと単語表ボトムシートの両方をこの1レスポンスで賄う。
 */
export interface EnArticleDetail extends EnArticleListItem {
  content: string; // 英語本文のリッチテキスト HTML
  translation: string | null; // 中国語訳のリッチテキスト HTML。段落順は content と一対一対応
  status: number; // 0=下書き 1=公開済み
  updatedAt: string;
  audios: EnAudioItem[];
  words: EnWordItem[];
}

/** 管理画面の英語記事一覧項目（バックエンドの AdminEnArticleListItem。状態と更新日時を含む） */
export interface AdminEnArticleListItem {
  id: number;
  title: string;
  level: EnArticleLevel;
  category: string;
  coverUrl: string | null;
  status: number; // 0=下書き 1=公開済み
  createdAt: string;
  updatedAt: string;
}

/** 管理画面の英語記事詳細（バックエンドの EnArticleDetailResponse。本文・音声・単語表を含む） */
export interface AdminEnArticleDetail extends AdminEnArticleListItem {
  content: string;
  translation: string | null;
  audios: EnAudioItem[];
  words: EnWordItem[];
}

/** 英語記事保存リクエスト（バックエンドの EnArticleSaveRequest。新規作成・編集共用） */
export interface EnArticleSavePayload {
  title: string;
  content: string;
  translation: string; // 中国語訳のリッチテキスト（空文字可）。段落は本文と一対一対応
  level: string;
  category: string;
  coverUrl: string | null;
  status: number; // 0=下書き 1=公開
  audios: { url: string; title: string | null; sortOrder: number }[];
  words: {
    sentenceIndex: number;
    word: string;
    phonetic: string | null;
    partOfSpeech: string | null;
    meaningZh: string;
    exampleEn: string | null;
    exampleZh: string | null;
    sortOrder: number;
  }[];
}
