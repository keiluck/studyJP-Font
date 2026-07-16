import request from "./request";
import type { CategoryItem, CategoryScope } from "@/types/category";

/** 有効な分類のみ返す（記事一覧などの絞り込みドロップダウン用） */
export function fetchCategories(scope: CategoryScope): Promise<CategoryItem[]> {
  return request.get("/api/user/categories", { params: { scope } });
}
