/** 分類（辞書）管理の型定義。scope は固定3値のみ（バックエンドの CategoryScope と一致させる） */
export type CategoryScope = "ARTICLE_LEVEL" | "ARTICLE_CATEGORY" | "QUESTION_CATEGORY";

export interface CategoryItem {
  id: number;
  scope: CategoryScope;
  value: string;
  status: number; // 0=無効 1=有効
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreatePayload {
  scope: CategoryScope;
  value: string;
}

export interface CategoryUpdatePayload {
  value: string;
  status: number;
}
