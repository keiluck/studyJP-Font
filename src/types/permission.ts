/** 権限モジュール（フェーズ9）の型定義。管理者ロールは固定3値（バックエンドの AdminRole と一致させる） */
export type AdminRole = "SUPER_ADMIN" | "CONTENT_ADMIN" | "USER_ADMIN";

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "スーパー管理者",
  CONTENT_ADMIN: "コンテンツ管理者",
  USER_ADMIN: "ユーザー管理者",
};

/** コンテンツ（記事/英語精読/問題）のアクセスレベル。0=無料試読 1=VIP限定 */
export type AccessLevel = 0 | 1;

/** 管理者アカウント情報（admin_user テーブル、SUPER_ADMIN専用の管理者アカウント管理で使う） */
export interface AdminAccountItem {
  id: number;
  username: string;
  role: AdminRole;
  status: number; // 1=有効 0=無効
  createdAt: string;
}

export interface AdminAccountCreatePayload {
  username: string;
  password: string;
  role: AdminRole;
  status: number;
}

export interface AdminAccountUpdatePayload {
  password?: string;
  role?: AdminRole;
  status?: number;
}
