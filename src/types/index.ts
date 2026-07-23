import type { AdminRole } from "./permission";

/** バックエンド共通レスポンス形式。axios のインターセプターで解包されるため、業務コードは基本的に data のみを扱う */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** ページングレスポンス。バックエンドの PageResult に対応 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** ページング取得リクエストの基本パラメータ。page は 1 始まり */
export interface PageQuery {
  page: number;
  pageSize: number;
}

/** ユーザー情報（user テーブル、フロント側） */
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  status: number; // 1=有効 0=無効
  vip: boolean; // フェーズ9：vipExpireAt が未来かどうかの算出値
  vipExpireAt: string | null;
  createdAt: string;
}

/** 管理者情報（admin_user テーブル） */
export interface AdminInfo {
  id: number;
  username: string;
  status: number;
  role: AdminRole;
}

/** 記事レベル。値は分類管理（scope=ARTICLE_LEVEL）で管理されるため固定リテラルにしない */
export type ArticleLevel = string;

/** 記事一覧項目（本文を含まない） */
export interface ArticleListItem {
  id: number;
  title: string;
  level: ArticleLevel;
  category: string;
  coverUrl: string | null;
  accessLevel: number; // 0=無料試読 1=VIP限定（フェーズ9）
  createdAt: string;
}

/** 品詞（背景着色用）：名詞/動詞/形容詞/外来語（カタカナ）。それ以外は着色しない */
export type WordType = "noun" | "verb" | "adj" | "loan";

/** 分かち書き単位：振り仮名注記の最小単位 */
export interface RubyWord {
  text: string; // 単語表記（漢字・カタカナ・英数字を含む場合あり）
  ruby?: string; // 振り仮名の読み。仮名のみなど注記不要な語では省略
  wordType?: WordType; // kuromoji の品詞マッピング。背景着色に使用
}

/** 文：読み上げの最小単位（タイムライン対応データはバックエンド未提供のため現状未使用） */
export interface Sentence {
  id: string;
  text: string; // 日本語原文
  translation: string; // 中国語訳
  startTime: number; // 音声内の開始秒
  endTime: number; // 終了秒
  rubyWords?: RubyWord[]; // 分かち書き＋振り仮名注記。未分割の文では空
}

/**
 * 記事詳細（バックエンドの ArticleDetailResponse）：リッチテキスト本文＋複数音声。
 * 読書ページでは content を段落ごとに解析して表示する（lib/articleContent.ts）。
 * 振り仮名は kuromoji によりフロント側で生成する（lib/furigana.ts）。
 * 文単位のタイムライン（音声と文の同期）はバックエンドの対応データが揃い次第有効化する（Sentence 型は将来のために保持）。
 */
export interface ArticleDetail extends ArticleListItem {
  content: string; // 日本語本文のリッチテキスト HTML（管理画面の wangEditor で入力）
  translation: string | null; // 中国語訳のリッチテキスト HTML。段落順は content と一対一対応
  status: number; // 0=下書き 1=公開済み
  updatedAt: string;
  audios: AudioItem[]; // 複数音声。sortOrder の昇順で表示
  words: WordItem[]; // 単語表（sortOrder 順の全件）。句中ハイライトと単語表ボトムシートの両方をこの1レスポンスで賄う
}

/** 音声（バックエンドの AudioItem） */
export interface AudioItem {
  id: number;
  url: string;
  title: string | null;
  sortOrder: number;
}

/**
 * 単語表の1件（バックエンドの WordItem）。日本語版は kuromoji で分かち書きした
 * トークン列に対して `word`（本文中の表記そのまま、漢字表記）の完全一致でマッチする
 * （lib/articleContent.ts の `matchVocabInSentence`）。`sentenceIndex` は管理画面の
 * 記録用途のみで、ハイライトのマッチには使用しない（英語モジュールと同じ理由：
 * 句序号の入力ミスでその文の単語が丸ごと非表示になる不具合を避けるため）。
 */
export interface WordItem {
  id: number;
  sentenceIndex: number;
  word: string; // 見出し語（本文中の表記そのまま。漢字表記があれば漢字、無ければ仮名表記）
  reading: string | null; // ふりがな（ひらがな読み）
  partOfSpeech: string | null; // 品詞（自由入力。例：名詞/動詞/形容詞/副詞）
  meaningZh: string; // 中国語釈義
  exampleJa: string | null; // 例文（日本語）
  exampleZh: string | null; // 例文の中国語訳
  sortOrder: number;
}

/** ログインレスポンス（token ＋ ユーザー情報） */
export interface LoginResult<T = UserInfo> {
  token: string;
  user: T;
}

/** 管理画面のログインレスポンス（バックエンドの AdminLoginResponse、フラット構造） */
export interface AdminLoginResult {
  token: string;
  id: number;
  username: string;
  role: AdminRole;
}

/** 管理画面の記事一覧項目（バックエンドの AdminArticleListItem。状態と更新日時を含む） */
export interface AdminArticleListItem {
  id: number;
  title: string;
  level: ArticleLevel;
  category: string;
  coverUrl: string | null;
  status: number; // 0=下書き 1=公開済み
  accessLevel: number; // 0=無料試読 1=VIP限定（フェーズ9）
  createdAt: string;
  updatedAt: string;
}

/** 管理画面の記事詳細（バックエンドの ArticleDetailResponse。本文と音声一覧を含む） */
export interface AdminArticleDetail extends AdminArticleListItem {
  content: string; // 日本語本文のリッチテキスト HTML
  translation: string | null; // 中国語訳のリッチテキスト HTML。段落は本文と一対一対応
  audios: AudioItem[];
  words: WordItem[];
}

/** 記事保存リクエスト（バックエンドの ArticleSaveRequest。新規作成・編集共用） */
export interface ArticleSavePayload {
  title: string;
  content: string;
  translation: string; // 中国語訳のリッチテキスト（空文字可）。段落は本文と一対一対応
  level: string;
  category: string;
  coverUrl: string | null;
  status: number; // 0=下書き 1=公開
  accessLevel: number; // 0=無料試読 1=VIP限定（フェーズ9）
  audios: { url: string; title: string | null; sortOrder: number }[];
  words: {
    sentenceIndex: number;
    word: string;
    reading: string | null;
    partOfSpeech: string | null;
    meaningZh: string;
    exampleJa: string | null;
    exampleZh: string | null;
    sortOrder: number;
  }[];
}
