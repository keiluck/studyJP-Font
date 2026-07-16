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
  createdAt: string;
}

/** 管理者情報（admin_user テーブル） */
export interface AdminInfo {
  id: number;
  username: string;
  status: number;
}

/** 記事レベル */
export type ArticleLevel = "N5" | "N4" | "N3" | "N2" | "N1";

/** 記事一覧項目（本文を含まない） */
export interface ArticleListItem {
  id: number;
  title: string;
  level: ArticleLevel;
  category: string;
  coverUrl: string | null;
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
}

/** 音声（バックエンドの AudioItem） */
export interface AudioItem {
  id: number;
  url: string;
  title: string | null;
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
}

/** 管理画面の記事一覧項目（バックエンドの AdminArticleListItem。状態と更新日時を含む） */
export interface AdminArticleListItem {
  id: number;
  title: string;
  level: ArticleLevel;
  category: string;
  coverUrl: string | null;
  status: number; // 0=下書き 1=公開済み
  createdAt: string;
  updatedAt: string;
}

/** 管理画面の記事詳細（バックエンドの ArticleDetailResponse。本文と音声一覧を含む） */
export interface AdminArticleDetail extends AdminArticleListItem {
  content: string; // 日本語本文のリッチテキスト HTML
  translation: string | null; // 中国語訳のリッチテキスト HTML。段落は本文と一対一対応
  audios: AudioItem[];
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
  audios: { url: string; title: string | null; sortOrder: number }[];
}
