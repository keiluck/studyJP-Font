/** トップページ主図バナーの型定義。他モジュールの型とは独立させる */

/** バナークリック時の遷移先種別（バックエンドの BannerLinkType と一致させる） */
export type BannerLinkType = "ARTICLE" | "EN_ARTICLE" | "PRACTICE" | "URL" | "NONE";

/** ユーザー向けバナー項目（バックエンドの HomeBannerItem） */
export interface HomeBannerItem {
  id: number;
  title: string;
  subtitle: string | null;
  tag: string | null;
  imageUrl: string;
  linkType: BannerLinkType;
  linkTarget: string | null;
  sortOrder: number;
}

/** 管理画面のバナー項目（バックエンドの AdminHomeBannerItem。状態と更新日時を含む） */
export interface AdminHomeBannerItem {
  id: number;
  title: string;
  subtitle: string | null;
  tag: string | null;
  imageUrl: string;
  linkType: BannerLinkType;
  linkTarget: string | null;
  sortOrder: number;
  status: number; // 0=無効 1=有効
  createdAt: string;
  updatedAt: string;
}

/** バナー保存リクエスト（バックエンドの HomeBannerSaveRequest。新規作成・編集共用） */
export interface HomeBannerSavePayload {
  title: string;
  subtitle: string | null;
  tag: string | null;
  imageUrl: string;
  linkType: BannerLinkType;
  linkTarget: string | null;
  sortOrder: number;
  status: number;
}
