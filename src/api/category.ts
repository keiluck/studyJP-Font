import request from "./request";
import type { CategoryItem, CategoryScope } from "@/types/category";

/**
 * 有効な分類のみ返す（記事一覧などの絞り込みドロップダウン用）。
 * subject は QUESTION_CATEGORY scope のときのみ意味を持つ（学科でスコープする、フェーズ10）
 */
export function fetchCategories(scope: CategoryScope, subject?: string): Promise<CategoryItem[]> {
  return request.get("/api/user/categories", { params: { scope, subject } });
}
