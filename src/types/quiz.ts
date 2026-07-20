/**
 * 問題演習（クイズ）モジュールの型定義。バックエンドの DTO（quiz-module skill）と一致させる。
 * 未回答時、Question の myLabels / correctLabels / explanation はレスポンスに存在しない
 * （カンニング防止のためバックエンドが省略する）。
 */

/** 1=単一選択 2=多肢選択 */
export type QuestionType = 1 | 2;

export interface QuestionOptionItem {
  label: string; // A〜F
  content: string;
}

/** 出題（GET /api/user/practices/{id}/questions/{seq}） */
export interface Question {
  seq: number;
  questionId: number;
  type: QuestionType;
  stem: string;
  options: QuestionOptionItem[];
  answered: boolean;
  myLabels?: string[]; // 回答後のみ存在
  correctLabels?: string[]; // 回答後のみ存在
  explanation?: string; // 回答後のみ存在（試題詳解 = 原解析）
}

/** 回答提出レスポンス（POST /api/user/practices/{id}/answers） */
export interface AnswerResult {
  correct: boolean;
  myLabels: string[];
  correctLabels: string[];
  explanation: string;
}

/** 答題カードの1項目 */
export interface PracticeCardItem {
  seq: number;
  questionId: number;
  answered: boolean;
  correct: boolean | null; // 未回答時は null
}

/** 答題カード + 集計（GET /api/user/practices/{id}） */
export interface PracticeCard {
  id: number;
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  finished: boolean;
  items: PracticeCardItem[];
}

/** 練習開始（POST /api/user/practices）レスポンス。retry も同形式 */
export interface PracticeStartResult {
  id: number;
  questionCount: number;
}

/** 練習開始リクエスト。すべて任意。subject は学科（大分類、フェーズ10）、category と併用可 */
export interface PracticeStartPayload {
  count?: number;
  type?: QuestionType;
  subject?: string;
  category?: string;
}

/** ===== 管理者向け：問題管理 ===== */

/** 管理者向け問題一覧項目（下書きを含み、選択肢は含まない） */
export interface AdminQuestionListItem {
  id: number;
  type: QuestionType;
  subject: string;
  stem: string;
  category: string | null;
  status: number; // 0=下書き 1=公開済み
  accessLevel: number; // 0=無料試読 1=VIP限定（フェーズ9）
  createdAt: string;
  updatedAt: string;
}

export interface AdminQuestionOptionItem {
  id: number;
  label: string;
  content: string;
  correct: boolean;
}

/** 管理者向け問題詳細（選択肢 + is_correct + 解析を含む） */
export interface AdminQuestionDetail {
  id: number;
  type: QuestionType;
  subject: string;
  stem: string;
  explanation: string | null;
  category: string | null;
  status: number;
  accessLevel: number; // 0=無料試読 1=VIP限定（フェーズ9）
  createdAt: string;
  updatedAt: string;
  options: AdminQuestionOptionItem[];
}

export interface QuestionOptionPayload {
  content: string;
  correct: boolean;
}

/** 問題の新規作成／編集リクエスト。選択肢は全置換で同期更新される。subject（学科）は必須 */
export interface QuestionSavePayload {
  type: QuestionType;
  subject: string;
  stem: string;
  explanation?: string;
  category?: string;
  status: number; // 0=下書き 1=公開
  accessLevel: number; // 0=無料試読 1=VIP限定（フェーズ9）
  options: QuestionOptionPayload[];
}
