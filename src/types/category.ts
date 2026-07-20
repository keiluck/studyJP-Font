/** 分類（辞書）管理の型定義。scope は固定6値のみ（バックエンドの CategoryScope と一致させる） */
export type CategoryScope =
  | "ARTICLE_LEVEL"
  | "ARTICLE_CATEGORY"
  | "QUESTION_CATEGORY"
  | "EN_ARTICLE_LEVEL"
  | "EN_ARTICLE_CATEGORY"
  | "QUESTION_SUBJECT";

export interface CategoryItem {
  id: number;
  scope: CategoryScope;
  /** QUESTION_CATEGORY scope の項目のみ値を持つ（学科、フェーズ10）。他 scope は常に null */
  subject: string | null;
  value: string;
  status: number; // 0=無効 1=有効
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreatePayload {
  scope: CategoryScope;
  /** QUESTION_CATEGORY scope のときのみ必須（学科） */
  subject?: string;
  value: string;
}

export interface CategoryUpdatePayload {
  value: string;
  status: number;
}
